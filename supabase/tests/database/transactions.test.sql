-- Testes de transactions (pgTAP). Rodar: pnpm db:test
begin;

create extension if not exists pgtap with schema extensions;

select plan(14);

create or replace function pg_temp.login(uid uuid) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;

create or replace function pg_temp.affected(q text) returns int
language plpgsql as $$
declare n int;
begin
  execute q;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Ids de apoio (lidos antes de trocar de papel)
create temp table ids on commit drop as
select
  (select id from public.categories where user_id = '00000000-0000-4000-8000-000000000002' and type = 'expense' and name = 'Mercado') as pai_mercado,
  (select id from public.categories where user_id = '00000000-0000-4000-8000-000000000002' and type = 'income' and name = 'Vendas') as pai_vendas,
  (select id from public.payment_methods where user_id = '00000000-0000-4000-8000-000000000002' and kind = 'pix') as pai_pix,
  (select id from public.categories where user_id = '00000000-0000-4000-8000-000000000003' and type = 'expense' and name = 'Mercado') as namorada_mercado;
grant select on ids to authenticated;

select pg_temp.login('00000000-0000-4000-8000-000000000002');

-- Normalização -----------------------------------------------------------------
insert into public.transactions (user_id, type, description, amount_cents, status, due_date, category_id, payment_method_id)
select '00000000-0000-4000-8000-000000000002', 'expense', 'Feira', 15000, 'paid', '2026-11-10', pai_mercado, pai_pix from ids;

select is(
  (select paid_cents from public.transactions where description = 'Feira')::bigint, 15000::bigint,
  'marcar como pago preenche o valor pago'
);
select isnt(
  (select paid_at from public.transactions where description = 'Feira'), null,
  'marcar como pago preenche a data de pagamento'
);

insert into public.transactions (user_id, type, description, amount_cents, paid_cents, status, due_date, category_id)
select '00000000-0000-4000-8000-000000000002', 'income', 'Moto Pedro 1/5', 130000, 50000, 'partial', '2026-12-10', pai_vendas from ids;

select is(
  (select status::text from public.transactions where description = 'Moto Pedro 1/5'), 'partial',
  'pagamento parcial fica como parcial'
);

update public.transactions set paid_cents = 130000 where description = 'Moto Pedro 1/5';
select is(
  (select status::text from public.transactions where description = 'Moto Pedro 1/5'), 'paid',
  'parcial que atinge o valor devido vira pago'
);

update public.transactions set interest_cents = 6500, status = 'partial', paid_cents = 130000
where description = 'Moto Pedro 1/5';
select is(
  (select remaining_cents from public.transactions_with_status where description = 'Moto Pedro 1/5')::bigint,
  6500::bigint,
  'juros entram no valor devido: falta só o juro'
);

update public.transactions set status = 'pending' where description = 'Moto Pedro 1/5';
select is(
  (select paid_cents from public.transactions where description = 'Moto Pedro 1/5')::bigint, 0::bigint,
  'voltar para pendente zera o valor pago'
);

-- Situação efetiva ---------------------------------------------------------------
insert into public.transactions (user_id, type, description, amount_cents, status, due_date, category_id, payment_method_id)
select '00000000-0000-4000-8000-000000000002', 'expense', 'Conta antiga', 9000, 'pending', public.today_sp() - 1, pai_mercado, pai_pix from ids;

select is(
  (select effective_status from public.transactions_with_status where description = 'Conta antiga'), 'overdue',
  'pendente com vencimento passado aparece como atrasado'
);
select is(
  (select effective_status from public.transactions_with_status where description = 'Feira'), 'paid',
  'pago nunca fica atrasado'
);

-- Regras de integridade -------------------------------------------------------------
select throws_ok(
  $$ insert into public.transactions (user_id, type, description, amount_cents, due_date, category_id)
     select '00000000-0000-4000-8000-000000000002', 'expense', 'Sem forma', 100, '2026-11-01', pai_mercado from ids $$,
  '23514', null,
  'saída sem forma de pagamento é recusada'
);

select throws_ok(
  $$ insert into public.transactions (user_id, type, description, amount_cents, due_date, category_id)
     select '00000000-0000-4000-8000-000000000002', 'income', 'Tipo errado', 100, '2026-11-01', pai_mercado from ids $$,
  '23503', null,
  'categoria de saída não serve para entrada'
);

select throws_ok(
  $$ insert into public.transactions (user_id, type, description, amount_cents, due_date, category_id, payment_method_id)
     select '00000000-0000-4000-8000-000000000002', 'expense', 'Categoria alheia', 100, '2026-11-01', namorada_mercado, pai_pix from ids $$,
  '23503', null,
  'não dá para usar a categoria de outra pessoa'
);

select throws_ok(
  $$ insert into public.transactions (user_id, type, description, amount_cents, due_date, category_id, payment_method_id)
     select '00000000-0000-4000-8000-000000000003', 'expense', 'Para outro', 100, '2026-11-01', namorada_mercado, null from ids $$,
  '42501', null,
  'não dá para criar lançamento em nome de outra pessoa'
);

-- Admin ------------------------------------------------------------------------
reset role;
select pg_temp.login('00000000-0000-4000-8000-000000000001');

select is(
  (select count(*) from public.transactions_with_status where user_id = '00000000-0000-4000-8000-000000000002')::int, 3,
  'admin enxerga os lançamentos do pai pela view'
);

select is(
  pg_temp.affected($q$ update public.transactions set description = 'mexido' where user_id = '00000000-0000-4000-8000-000000000002' $q$),
  0,
  'admin NÃO altera lançamentos de outra pessoa'
);

select * from finish();
rollback;

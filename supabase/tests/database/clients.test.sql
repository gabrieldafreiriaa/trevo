-- Testes de clients e client_balances (pgTAP). Rodar: pnpm db:test
begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

create or replace function pg_temp.login(uid uuid) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;

create temp table ids on commit drop as
select
  (select id from public.categories where user_id = '00000000-0000-4000-8000-000000000002' and type = 'income' and name = 'Vendas') as vendas,
  (select id from public.categories where user_id = '00000000-0000-4000-8000-000000000002' and type = 'expense' and name = 'Compras') as compras,
  (select id from public.payment_methods where user_id = '00000000-0000-4000-8000-000000000002' and kind = 'pix') as pix,
  public.today_sp() as hoje;
grant select on ids to authenticated;

select pg_temp.login('00000000-0000-4000-8000-000000000002');

insert into public.clients (user_id, name, phone) values ('00000000-0000-4000-8000-000000000002', 'Pedro', '11999990000');

create temp table pedro on commit drop as select id from public.clients where name = 'Pedro';
grant select on pedro to authenticated;

-- Moto do Pedro: 5x de R$ 1.300. 1ª já paga, 2ª atrasada com R$ 65 de juros, demais futuras.
insert into public.transactions (user_id, type, description, amount_cents, interest_cents, status, due_date, category_id, client_id,
                                 installment_group_id, installment_number, installment_total)
select '00000000-0000-4000-8000-000000000002', 'income', 'Moto CG 160', 130000, i, s::public.transaction_status, d, vendas, (select id from pedro),
       '11111111-1111-4111-8111-111111111111', n, 5
from ids cross join lateral (values
  (1, 'paid',    0,    hoje - 40),
  (2, 'pending', 6500, hoje - 10),
  (3, 'pending', 0,    hoje + 20),
  (4, 'pending', 0,    hoje + 50),
  (5, 'pending', 0,    hoje + 80)
) as p(n, s, i, d);

select lives_ok(
  $$ insert into public.transactions (user_id, type, description, amount_cents, status, due_date, category_id, client_id,
                                      installment_group_id, installment_number, installment_total)
     select '00000000-0000-4000-8000-000000000002', 'income', 'Entrada da moto', 200000, 'paid', hoje - 45, vendas, (select id from pedro),
            '11111111-1111-4111-8111-111111111111', 0, 5 from ids $$,
  'a entrada entra no mesmo grupo da venda como parcela 0'
);

select is(
  (select sold_cents from public.client_balances('00000000-0000-4000-8000-000000000002'))::bigint,
  850000::bigint, 'total vendido ao Pedro: entrada de R$ 2.000 + 5 x R$ 1.300'
);
select is(
  (select received_cents from public.client_balances('00000000-0000-4000-8000-000000000002'))::bigint,
  330000::bigint, 'recebido: a entrada e a 1ª parcela'
);
select is(
  (select remaining_cents from public.client_balances('00000000-0000-4000-8000-000000000002'))::bigint,
  526500::bigint, 'a receber: 4 parcelas + R$ 65 de juros'
);
select is(
  (select overdue_cents from public.client_balances('00000000-0000-4000-8000-000000000002'))::bigint,
  136500::bigint, 'em atraso: a 2ª parcela com juros'
);
select is(
  (select overdue_count from public.client_balances('00000000-0000-4000-8000-000000000002')),
  1, 'uma parcela atrasada'
);

select throws_ok(
  $$ insert into public.transactions (user_id, type, description, amount_cents, due_date, category_id, payment_method_id, client_id)
     select '00000000-0000-4000-8000-000000000002', 'expense', 'Saída com cliente', 100, hoje, compras, pix, (select id from pedro) from ids $$,
  '23514', null,
  'cliente só pode ser ligado a entradas'
);

-- Outra pessoa não vê nem usa o cliente do pai.
reset role;
select pg_temp.login('00000000-0000-4000-8000-000000000003');

select is((select count(*) from public.clients)::int, 0, 'namorada não enxerga os clientes do pai');

select throws_ok(
  $$ insert into public.transactions (user_id, type, description, amount_cents, due_date, category_id, client_id)
     select '00000000-0000-4000-8000-000000000003', 'income', 'Carona', 100, '2026-11-01',
            (select id from public.categories where user_id = '00000000-0000-4000-8000-000000000003' and type = 'income' limit 1),
            (select id from pedro) $$,
  '23503', null,
  'não dá para ligar um lançamento ao cliente de outra pessoa'
);

select * from finish();
rollback;

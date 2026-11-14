-- Testes das funções do dashboard (pgTAP). Rodar: pnpm db:test
begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

create or replace function pg_temp.login(uid uuid) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;

-- Mês fixo de teste, longe do seed (março/2030) e o mês anterior (fevereiro/2030).
create temp table ids on commit drop as
select
  (select id from public.categories where user_id = '00000000-0000-4000-8000-000000000003' and type = 'income' and name = 'Salário') as salario,
  (select id from public.categories where user_id = '00000000-0000-4000-8000-000000000003' and type = 'expense' and name = 'Mercado') as mercado,
  (select id from public.categories where user_id = '00000000-0000-4000-8000-000000000003' and type = 'expense' and name = 'Moradia') as moradia,
  (select id from public.payment_methods where user_id = '00000000-0000-4000-8000-000000000003' and kind = 'pix') as pix,
  (select id from public.payment_methods where user_id = '00000000-0000-4000-8000-000000000003' and kind = 'credit_card') as credito;
grant select on ids to authenticated;

select pg_temp.login('00000000-0000-4000-8000-000000000003');

insert into public.transactions (user_id, type, description, amount_cents, paid_cents, status, due_date, category_id, payment_method_id)
select '00000000-0000-4000-8000-000000000003', v.type::public.transaction_type, v.d, v.amount, v.paid, v.status::public.transaction_status, v.due::date, v.cat, v.pm
from ids cross join lateral (values
  ('income',  'Salário',  500000, 0,     'paid',    '2030-03-05', salario, pix),
  ('expense', 'Aluguel',  150000, 0,     'paid',    '2030-03-06', moradia, pix),
  ('expense', 'Mercado',   40000, 0,     'pending', '2030-03-20', mercado, credito),
  ('expense', 'Feira',     10000, 4000,  'partial', '2030-03-21', mercado, pix),
  ('income',  'Salário',  450000, 0,     'paid',    '2030-02-05', salario, pix),
  ('expense', 'Aluguel',  150000, 0,     'paid',    '2030-02-06', moradia, pix)
) as v(type, d, amount, paid, status, due, cat, pm);

create temp table s on commit drop as
select * from public.dashboard_summary('00000000-0000-4000-8000-000000000003', '2030-03-15');
grant select on s to authenticated;

select is((select income_realized from s), 500000::bigint, 'entradas realizadas no mês');
select is((select expense_realized from s), 154000::bigint, 'saídas realizadas: aluguel + parte paga da feira');
select is((select expense_due from s), 200000::bigint, 'saídas previstas: tudo que vence no mês');
select is((select to_pay from s), 46000::bigint, 'a pagar: mercado + resto da feira');
select is((select prev_balance_realized from s), 300000::bigint, 'saldo realizado do mês anterior');

select is(
  (select total_cents from public.spending_by_category('00000000-0000-4000-8000-000000000003', '2030-03-01')
   where category_id = (select mercado from ids)),
  50000::bigint, 'gastos com Mercado no mês'
);
select is(
  (select count(*) from public.spending_by_payment_method('00000000-0000-4000-8000-000000000003', '2030-03-01'))::int,
  2, 'gastos separados por forma de pagamento (Pix e cartão)'
);

select is(
  (select count(*) from public.monthly_history('00000000-0000-4000-8000-000000000003', '2030-03-01', 6))::int,
  6, 'histórico devolve 6 meses, mesmo sem lançamentos'
);
select is(
  (select income_cents from public.monthly_history('00000000-0000-4000-8000-000000000003', '2030-03-01', 6) where month = '2030-02-01'),
  450000::bigint, 'histórico traz as entradas de fevereiro'
);

-- Outra pessoa pedindo o resumo da namorada recebe zeros (RLS).
reset role;
select pg_temp.login('00000000-0000-4000-8000-000000000002');
select is(
  (select income_realized from public.dashboard_summary('00000000-0000-4000-8000-000000000003', '2030-03-15')),
  0::bigint, 'ninguém lê o resumo de outra pessoa'
);

select * from finish();
rollback;

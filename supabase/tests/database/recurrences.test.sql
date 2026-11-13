-- Testes de recurrences e da geração de lançamentos recorrentes (pgTAP). Rodar: pnpm db:test
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
  (select id from public.categories where user_id = '00000000-0000-4000-8000-000000000002' and type = 'expense' and name = 'Moradia') as moradia,
  (select id from public.payment_methods where user_id = '00000000-0000-4000-8000-000000000002' and kind = 'pix') as pix,
  date_trunc('month', public.today_sp())::date as m;
grant select on ids to authenticated;

select pg_temp.login('00000000-0000-4000-8000-000000000002');

-- Aluguel todo dia 31, começando no mês atual: gera mês atual + 3 meses = 4 lançamentos.
insert into public.recurrences (user_id, type, description, amount_cents, category_id, payment_method_id, day_of_month, starts_on)
select '00000000-0000-4000-8000-000000000002', 'expense', 'Aluguel do pai', 140000, moradia, pix, 31, m from ids;

select is(
  public.generate_recurring_transactions((select id from public.recurrences where description = 'Aluguel do pai')),
  4,
  'gera o mês atual e os próximos 3 meses'
);

select is(
  public.generate_recurring_transactions((select id from public.recurrences where description = 'Aluguel do pai')),
  0,
  'rodar de novo não duplica (idempotente)'
);

select is(
  (select count(*) from public.transactions t
   where t.description = 'Aluguel do pai'
     and t.due_date = (date_trunc('month', t.due_date) + interval '1 month' - interval '1 day')::date)::int,
  4,
  'dia 31 vira o último dia em meses mais curtos'
);

select is(
  (select bool_and(status = 'pending') from public.transactions where description = 'Aluguel do pai'),
  true,
  'lançamentos gerados começam pendentes'
);

-- Regra com fim: só gera até a data final.
insert into public.recurrences (user_id, type, description, amount_cents, category_id, payment_method_id, day_of_month, starts_on, ends_on)
select '00000000-0000-4000-8000-000000000002', 'expense', 'Curso', 30000, moradia, pix, 5, m, (m + interval '1 month' + interval '10 days')::date from ids;

select is(
  public.generate_recurring_transactions((select id from public.recurrences where description = 'Curso')),
  2,
  'respeita a data final da regra'
);

-- Regra pausada não gera.
insert into public.recurrences (user_id, type, description, amount_cents, category_id, payment_method_id, day_of_month, starts_on, active)
select '00000000-0000-4000-8000-000000000002', 'expense', 'Pausada', 1000, moradia, pix, 10, m, false from ids;

select is(
  public.generate_recurring_transactions((select id from public.recurrences where description = 'Pausada')),
  0,
  'regra pausada não gera nada'
);

-- Outro usuário não consegue gerar a partir da regra do pai.
reset role;
create temp table aluguel on commit drop as
select id from public.recurrences where description = 'Aluguel do pai';
grant select on aluguel to authenticated;
select pg_temp.login('00000000-0000-4000-8000-000000000003');

select is(
  public.generate_recurring_transactions((select id from aluguel)),
  0,
  'ninguém gera lançamentos a partir da regra de outra pessoa'
);

select throws_ok(
  $$ insert into public.transactions (user_id, type, description, amount_cents, due_date, category_id, payment_method_id, recurrence_id)
     select '00000000-0000-4000-8000-000000000003', 'expense', 'Pega carona', 100, '2026-11-01',
            (select id from public.categories where user_id = '00000000-0000-4000-8000-000000000003' and type = 'expense' limit 1),
            (select id from public.payment_methods where user_id = '00000000-0000-4000-8000-000000000003' limit 1),
            (select id from aluguel) $$,
  '23503', null,
  'não dá para ligar um lançamento à regra de outra pessoa'
);

-- Excluir a regra mantém o histórico (solta o vínculo).
reset role;
select pg_temp.login('00000000-0000-4000-8000-000000000002');
delete from public.recurrences where description = 'Curso';

select is(
  (select count(*) from public.transactions where description = 'Curso' and recurrence_id is null)::int,
  2,
  'excluir a regra mantém os lançamentos já criados'
);

select * from finish();
rollback;

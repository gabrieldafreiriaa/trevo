-- Testes de categories e payment_methods (pgTAP). Rodar: pnpm db:test
begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

create or replace function pg_temp.login(uid uuid) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;

-- Ajudante: executa um comando e devolve quantas linhas ele afetou.
create or replace function pg_temp.affected(q text) returns int
language plpgsql as $$
declare n int;
begin
  execute q;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Padrões ------------------------------------------------------------------
select is(
  (select count(*) from public.categories where user_id = '00000000-0000-4000-8000-000000000002')::int,
  16, 'usuário novo recebe 16 categorias padrão'
);
select is(
  (select count(*) from public.payment_methods where user_id = '00000000-0000-4000-8000-000000000002')::int,
  5, 'usuário novo recebe 5 formas de pagamento padrão'
);

-- Usuário comum (pai) --------------------------------------------------------
select pg_temp.login('00000000-0000-4000-8000-000000000002');

select is(
  (select count(distinct user_id) from public.categories)::int, 1,
  'usuário comum só enxerga as próprias categorias'
);

select lives_ok(
  $$ insert into public.categories (user_id, type, name) values ('00000000-0000-4000-8000-000000000002', 'expense', 'Moto') $$,
  'usuário cria categoria para si'
);

select throws_ok(
  $$ insert into public.categories (user_id, type, name) values ('00000000-0000-4000-8000-000000000003', 'expense', 'Invasão') $$,
  '42501', null,
  'usuário NÃO cria categoria para outro'
);

select throws_ok(
  $$ insert into public.categories (user_id, type, name) values ('00000000-0000-4000-8000-000000000002', 'expense', '  moto ') $$,
  '23505', null,
  'nome repetido (ignorando maiúsculas e espaços) é recusado'
);

select is(
  pg_temp.affected($q$ update public.payment_methods set name = 'invadido' where user_id = '00000000-0000-4000-8000-000000000003' $q$), 0,
  'usuário não altera forma de pagamento de outro'
);

-- Admin ----------------------------------------------------------------------
reset role;
select pg_temp.login('00000000-0000-4000-8000-000000000001');

select is(
  (select count(distinct user_id) from public.payment_methods)::int, 3,
  'admin enxerga as formas de pagamento de todos'
);

select is(
  pg_temp.affected($q$ delete from public.categories where user_id = '00000000-0000-4000-8000-000000000002' $q$), 0,
  'admin NÃO exclui categoria de outro'
);

select throws_ok(
  $$ update public.categories set user_id = '00000000-0000-4000-8000-000000000002' where user_id = '00000000-0000-4000-8000-000000000001' $$,
  '42501', null,
  'ninguém troca o dono de uma categoria'
);

select * from finish();
rollback;

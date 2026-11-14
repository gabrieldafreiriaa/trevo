-- Testes de RLS de profiles (pgTAP). Rodar: pnpm db:test
-- Usa os usuários do supabase/seed.sql.
begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

-- Ajudante: simula um usuário logado nesta transação.
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

-- Usuário comum (pai) -----------------------------------------------------
select pg_temp.login('00000000-0000-4000-8000-000000000002');

select is(
  (select count(*) from public.profiles)::int, 1,
  'usuário comum só enxerga o próprio perfil'
);

select is(public.is_admin(), false, 'is_admin() é falso para usuário comum');

select lives_ok(
  $$ update public.profiles set full_name = 'Pai do Gabriel' where id = '00000000-0000-4000-8000-000000000002' $$,
  'usuário comum pode mudar o próprio nome'
);

select throws_ok(
  $$ update public.profiles set role = 'admin' where id = '00000000-0000-4000-8000-000000000002' $$,
  '42501', null,
  'usuário comum NÃO pode se promover a admin'
);

select is(
  pg_temp.affected($q$ update public.profiles set full_name = 'invasão' where id = '00000000-0000-4000-8000-000000000003' $q$), 0,
  'usuário comum não altera o perfil de outro'
);

-- Admin (Gabriel) -----------------------------------------------------------
reset role;
select pg_temp.login('00000000-0000-4000-8000-000000000001');

select is(public.is_admin(), true, 'is_admin() é verdadeiro para o admin');

select is(
  (select count(*) from public.profiles)::int, 3,
  'admin enxerga todos os perfis'
);

select is(
  pg_temp.affected($q$ update public.profiles set full_name = 'editado pelo admin' where id = '00000000-0000-4000-8000-000000000002' $q$), 0,
  'admin NÃO altera o perfil de outro usuário'
);

-- Anônimo -----------------------------------------------------------------
reset role;
select set_config('request.jwt.claims', '', true);
set local role anon;

select throws_ok(
  $$ select count(*) from public.profiles $$,
  '42501', null,
  'visitante sem login não lê perfis'
);

select * from finish();
rollback;

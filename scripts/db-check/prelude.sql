-- Imitação mínima do Supabase para o `pnpm db:check` (ver run.mjs).
-- Simula o mínimo do ambiente Supabase para testar as migrations.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create schema extensions;
create extension pgcrypto schema extensions;
grant usage on schema public, auth, extensions to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;
create table auth.users (
  instance_id uuid, id uuid primary key, aud text, role text, email text,
  encrypted_password text, email_confirmed_at timestamptz,
  raw_app_meta_data jsonb, raw_user_meta_data jsonb,
  created_at timestamptz, updated_at timestamptz,
  confirmation_token text, email_change text, email_change_token_new text, recovery_token text
);
create table auth.identities (
  id uuid primary key, user_id uuid, provider_id text, identity_data jsonb, provider text,
  last_sign_in_at timestamptz, created_at timestamptz, updated_at timestamptz
);
create function auth.uid() returns uuid language sql stable as $$
  select (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid
$$;
grant execute on function auth.uid() to anon, authenticated;

-- Mini pgTAP: só o que os testes usam.
create table public._tap (n serial, ok boolean, descr text, detail text);
grant all on public._tap to anon, authenticated;
grant usage on sequence public._tap_n_seq to anon, authenticated;
create function public.plan(int) returns text language sql as $$ select 'plan '||$1 $$;
create function public.finish() returns setof text language sql as $$ select 'done' $$;
create function public._rec(ok boolean, d text, det text default null) returns text
language plpgsql security definer as $$
begin insert into public._tap(ok, descr, detail) values (ok, d, det); return case when ok then 'ok' else 'not ok' end; end $$;
create function public.is(anyelement, anyelement, text) returns text language sql as $$
  select public._rec($1 is not distinct from $2, $3, format('got %s expected %s', $1, $2)) $$;
create function public.isnt(anyelement, anyelement, text) returns text language sql as $$
  select public._rec($1 is distinct from $2, $3, format('got %s, should differ', $1)) $$;
create function public.lives_ok(text, text) returns text language plpgsql as $$
begin execute $1; return public._rec(true, $2);
exception when others then return public._rec(false, $2, sqlstate||' '||sqlerrm); end $$;
create function public.throws_ok(text, text, text, text) returns text language plpgsql as $$
begin execute $1; return public._rec(false, $4, 'did not throw');
exception when others then return public._rec(sqlstate = $2, $4, sqlstate||' '||sqlerrm); end $$;
grant execute on all functions in schema public to anon, authenticated;

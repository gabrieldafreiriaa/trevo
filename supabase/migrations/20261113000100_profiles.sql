-- S1 · Perfis, papel de admin e RLS.
-- Referência: docs/DATA_MODEL.md ("profiles", "Funções", "Políticas de RLS").

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 1 and 80),
  role public.user_role not null default 'user',
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Um perfil por usuário do Auth. Criado pelo trigger on_auth_user_created.';

alter table public.profiles enable row level security;

-- is_admin(): usada nas políticas de todas as tabelas.
-- security definer para poder ler profiles sem cair no próprio RLS (evita recursão).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Políticas
create policy "profiles: ler o próprio ou admin lê todos"
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "profiles: atualizar só o próprio"
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Privilégios por coluna: o usuário só pode mudar o próprio nome.
-- O papel (role) só muda pela service role ou pelo SQL editor.
revoke all on public.profiles from anon;
revoke insert, update, delete on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;

-- Cria o perfil quando um usuário é criado no Auth (convite ou seed).
-- No S2 esta função passa a semear também categorias e formas de pagamento.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

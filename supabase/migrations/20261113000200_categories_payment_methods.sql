-- S2 · Categorias e formas de pagamento, com os padrões criados para cada usuário novo.
-- Referência: docs/DATA_MODEL.md ("categories", "payment_methods", "Dados padrão").

-- Categorias -----------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.transaction_type not null,
  name text not null check (char_length(trim(name)) between 1 and 40),
  color text not null default '#64748b' check (color ~ '^#[0-9a-fA-F]{6}$'),
  icon text not null default 'circle-ellipsis' check (icon ~ '^[a-z0-9-]{1,40}$'),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  -- alvo da FK composta de transactions/recurrences (S3/S4): garante mesmo dono e mesmo tipo
  unique (id, user_id, type)
);

create unique index categories_user_type_name_key
  on public.categories (user_id, type, lower(trim(name)));

comment on table public.categories is 'Categorias de entradas e saídas de cada usuário.';

-- Formas de pagamento --------------------------------------------------------

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.payment_kind not null,
  name text not null check (char_length(trim(name)) between 1 and 40),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create unique index payment_methods_user_name_key
  on public.payment_methods (user_id, lower(trim(name)));

comment on table public.payment_methods is 'Formas de pagamento (Pix, cartão, dinheiro...) de cada usuário. É só um rótulo do lançamento.';

-- RLS: cada um mexe no que é seu; admin só lê ---------------------------------

alter table public.categories enable row level security;
alter table public.payment_methods enable row level security;

create policy "categories: ler os próprios ou admin lê todos"
  on public.categories for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "categories: criar os próprios"
  on public.categories for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "categories: alterar os próprios"
  on public.categories for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "categories: excluir os próprios"
  on public.categories for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "payment_methods: ler os próprios ou admin lê todos"
  on public.payment_methods for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "payment_methods: criar os próprios"
  on public.payment_methods for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "payment_methods: alterar os próprios"
  on public.payment_methods for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "payment_methods: excluir os próprios"
  on public.payment_methods for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.categories, public.payment_methods from anon;
revoke all on public.categories, public.payment_methods from authenticated;
grant select, insert, delete on public.categories, public.payment_methods to authenticated;

-- UPDATE só nas colunas editáveis: o dono (user_id) e o tipo da categoria nunca mudam.
-- (Revogar uma coluna não anula um GRANT na tabela inteira, por isso o grant é por coluna.)
grant update (name, color, icon, archived_at) on public.categories to authenticated;
grant update (name, kind, archived_at) on public.payment_methods to authenticated;

-- Padrões -------------------------------------------------------------------

create or replace function public.seed_user_defaults(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.categories (user_id, type, name, icon, color)
  values
    (p_user, 'expense', 'Moradia',      'house',          '#3b82f6'),
    (p_user, 'expense', 'Mercado',      'shopping-cart',  '#22c55e'),
    (p_user, 'expense', 'Restaurantes', 'utensils',       '#f97316'),
    (p_user, 'expense', 'Transporte',   'car',            '#6366f1'),
    (p_user, 'expense', 'Saúde',        'heart-pulse',    '#ef4444'),
    (p_user, 'expense', 'Educação',     'graduation-cap', '#8b5cf6'),
    (p_user, 'expense', 'Lazer',        'party-popper',   '#ec4899'),
    (p_user, 'expense', 'Compras',      'shopping-bag',   '#f59e0b'),
    (p_user, 'expense', 'Assinaturas',  'repeat',         '#14b8a6'),
    (p_user, 'expense', 'Outros',       'circle-ellipsis','#64748b'),
    (p_user, 'income',  'Salário',      'briefcase',      '#22c55e'),
    (p_user, 'income',  'Vendas',       'store',          '#14b8a6'),
    (p_user, 'income',  'Freela',       'laptop',         '#6366f1'),
    (p_user, 'income',  'Reembolso',    'undo-2',         '#f59e0b'),
    (p_user, 'income',  'Rendimentos',  'trending-up',    '#3b82f6'),
    (p_user, 'income',  'Outros',       'circle-ellipsis','#64748b')
  on conflict do nothing;

  insert into public.payment_methods (user_id, kind, name)
  values
    (p_user, 'credit_card', 'Cartão de crédito'),
    (p_user, 'debit_card',  'Cartão de débito'),
    (p_user, 'pix',         'Pix'),
    (p_user, 'cash',        'Dinheiro'),
    (p_user, 'boleto',      'Boleto')
  on conflict do nothing;
end;
$$;

revoke execute on function public.seed_user_defaults(uuid) from public, anon, authenticated;

-- O trigger de novo usuário passa a semear os padrões também.
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
  perform public.seed_user_defaults(new.id);
  return new;
end;
$$;

-- Usuários que já existiam antes desta migration também recebem os padrões.
select public.seed_user_defaults(id) from public.profiles;

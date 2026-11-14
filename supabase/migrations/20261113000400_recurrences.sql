-- S4 · Contas recorrentes (regras) e geração automática dos lançamentos previstos.
-- Referência: docs/DATA_MODEL.md ("recurrences", "Funções") e docs/ARCHITECTURE.md ("Recorrência").

create table public.recurrences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.transaction_type not null,
  description text not null check (char_length(trim(description)) between 1 and 80),
  amount_cents bigint not null check (amount_cents > 0),
  category_id uuid not null,
  payment_method_id uuid,
  day_of_month smallint not null check (day_of_month between 1 and 31),
  starts_on date not null,
  ends_on date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint recurrences_category_fkey
    foreign key (category_id, user_id, type)
    references public.categories (id, user_id, type),
  constraint recurrences_payment_method_fkey
    foreign key (payment_method_id, user_id)
    references public.payment_methods (id, user_id),
  -- alvo da FK composta de transactions: a regra precisa ser do mesmo dono do lançamento
  unique (id, user_id),
  constraint recurrences_ends_after_start check (ends_on is null or ends_on >= starts_on),
  constraint recurrences_expense_has_payment_method
    check (type = 'income' or payment_method_id is not null)
);

comment on table public.recurrences is 'Regras de contas fixas mensais. Os lançamentos são gerados por generate_recurring_transactions().';

create index recurrences_user_idx on public.recurrences (user_id);

create trigger recurrences_set_updated_at
  before update on public.recurrences
  for each row execute function public.set_updated_at();

-- Liga o lançamento à regra que o gerou ------------------------------------------
alter table public.transactions
  add column recurrence_id uuid,
  add constraint transactions_recurrence_fkey
    foreign key (recurrence_id, user_id)
    references public.recurrences (id, user_id)
    on delete set null (recurrence_id);

-- Um lançamento por regra por data: torna a geração idempotente.
create unique index transactions_recurrence_due_key
  on public.transactions (recurrence_id, due_date)
  where recurrence_id is not null;

-- A view precisa expor a coluna nova (t.* é expandido na criação da view).
create or replace view public.transactions_with_status
with (security_invoker = true)
as
select
  t.id, t.user_id, t.type, t.description, t.amount_cents, t.interest_cents, t.paid_cents,
  t.status, t.due_date, t.paid_at, t.category_id, t.payment_method_id,
  t.installment_group_id, t.installment_number, t.installment_total, t.notes,
  t.created_at, t.updated_at,
  (t.amount_cents + t.interest_cents) as due_cents,
  (t.amount_cents + t.interest_cents - t.paid_cents) as remaining_cents,
  case
    when t.status in ('pending', 'partial') and t.due_date < public.today_sp() then 'overdue'
    else t.status::text
  end as effective_status,
  t.recurrence_id
from public.transactions t;

-- RLS ------------------------------------------------------------------------
alter table public.recurrences enable row level security;

create policy "recurrences: ler as próprias ou admin lê todas"
  on public.recurrences for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "recurrences: criar as próprias"
  on public.recurrences for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "recurrences: alterar as próprias"
  on public.recurrences for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "recurrences: excluir as próprias"
  on public.recurrences for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.recurrences from anon;
revoke all on public.recurrences from authenticated;
grant select, insert, delete on public.recurrences to authenticated;
grant update (
  description, amount_cents, category_id, payment_method_id, day_of_month, starts_on, ends_on, active
) on public.recurrences to authenticated;

-- recurrence_id é gravado pela geração (security definer). A FK composta impede apontar
-- para a regra de outra pessoa, e não há GRANT UPDATE nessa coluna.

-- Geração --------------------------------------------------------------------
-- Cria, para cada regra ativa, os lançamentos mensais que faltam desde o início
-- da regra até hoje + 3 meses. Idempotente (índice único por regra + data).
-- · Chamada pelo pg_cron (sem usuário): gera para todos.
-- · Chamada por um usuário logado: só para as regras dele.
create or replace function public.generate_recurring_transactions(p_recurrence uuid default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_horizon date := (date_trunc('month', public.today_sp()) + interval '3 months' + interval '1 month' - interval '1 day')::date;
  v_count integer;
begin
  with rules as (
    select r.*
    from public.recurrences r
    where r.active
      and (p_recurrence is null or r.id = p_recurrence)
      and (v_uid is null or r.user_id = v_uid)
  ),
  months as (
    select
      r.id as recurrence_id,
      gs::date as month_start
    from rules r
    cross join lateral generate_series(
      date_trunc('month', r.starts_on),
      date_trunc('month', least(coalesce(r.ends_on, v_horizon), v_horizon)),
      interval '1 month'
    ) as gs
  ),
  occurrences as (
    select
      r.*,
      least(
        (m.month_start + (r.day_of_month - 1) * interval '1 day')::date,
        (m.month_start + interval '1 month' - interval '1 day')::date
      ) as occurs_on
    from months m
    join rules r on r.id = m.recurrence_id
  ),
  inserted as (
    insert into public.transactions (
      user_id, type, description, amount_cents, status, due_date,
      category_id, payment_method_id, recurrence_id
    )
    select
      o.user_id, o.type, o.description, o.amount_cents, 'pending', o.occurs_on,
      o.category_id, o.payment_method_id, o.id
    from occurrences o
    where o.occurs_on >= o.starts_on
      and (o.ends_on is null or o.occurs_on <= o.ends_on)
    on conflict (recurrence_id, due_date) where recurrence_id is not null do nothing
    returning 1
  )
  select count(*) into v_count from inserted;

  return v_count;
end;
$$;

revoke execute on function public.generate_recurring_transactions(uuid) from public, anon;
grant execute on function public.generate_recurring_transactions(uuid) to authenticated;

-- Agendamento diário às 03:00 de Brasília (06:00 UTC). --------------------------------
-- Em ambientes sem pg_cron (ex.: pnpm db:check), o bloco é ignorado.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron with schema pg_catalog;
    perform cron.schedule(
      'trevo-recurrences',
      '0 6 * * *',
      'select public.generate_recurring_transactions()'
    );
  end if;
end;
$$;

-- Ao excluir "esta e as próximas" parcelas, o total das que sobram é ajustado.
grant update (installment_total) on public.transactions to authenticated;

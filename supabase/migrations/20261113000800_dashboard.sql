-- S6 · Funções do dashboard. Todas `security invoker`: respeitam o RLS de quem chama.
-- Referência: docs/DATA_MODEL.md ("Funções", "Regras de negócio").
-- p_month é qualquer data do mês de referência (normalizada para o 1º dia).

-- Resumo do mês ------------------------------------------------------------------
create or replace function public.dashboard_summary(p_user uuid, p_month date)
returns table (
  income_realized bigint,
  expense_realized bigint,
  income_due bigint,
  expense_due bigint,
  to_receive bigint,
  to_pay bigint,
  prev_balance_realized bigint,
  overdue_count integer,
  overdue_cents bigint,
  clients_to_receive bigint,
  clients_overdue bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with bounds as (
    select
      date_trunc('month', p_month)::date as m_start,
      (date_trunc('month', p_month) + interval '1 month' - interval '1 day')::date as m_end,
      (date_trunc('month', p_month) - interval '1 month')::date as p_start,
      (date_trunc('month', p_month) - interval '1 day')::date as p_end
  ),
  mine as (
    select t.* from public.transactions_with_status t where t.user_id = p_user
  )
  select
    coalesce(sum(t.paid_cents) filter (where t.type = 'income' and t.due_date between b.m_start and b.m_end), 0)::bigint,
    coalesce(sum(t.paid_cents) filter (where t.type = 'expense' and t.due_date between b.m_start and b.m_end), 0)::bigint,
    coalesce(sum(t.due_cents) filter (where t.type = 'income' and t.due_date between b.m_start and b.m_end), 0)::bigint,
    coalesce(sum(t.due_cents) filter (where t.type = 'expense' and t.due_date between b.m_start and b.m_end), 0)::bigint,
    coalesce(sum(t.remaining_cents) filter (where t.type = 'income' and t.status <> 'paid' and t.due_date between b.m_start and b.m_end), 0)::bigint,
    coalesce(sum(t.remaining_cents) filter (where t.type = 'expense' and t.status <> 'paid' and t.due_date between b.m_start and b.m_end), 0)::bigint,
    (
      coalesce(sum(t.paid_cents) filter (where t.type = 'income' and t.due_date between b.p_start and b.p_end), 0)
      - coalesce(sum(t.paid_cents) filter (where t.type = 'expense' and t.due_date between b.p_start and b.p_end), 0)
    )::bigint,
    (count(*) filter (where t.effective_status = 'overdue'))::integer,
    coalesce(sum(t.remaining_cents) filter (where t.effective_status = 'overdue'), 0)::bigint,
    coalesce(sum(t.remaining_cents) filter (where t.client_id is not null and t.status <> 'paid'), 0)::bigint,
    coalesce(sum(t.remaining_cents) filter (where t.client_id is not null and t.effective_status = 'overdue'), 0)::bigint
  from bounds b
  left join mine t on true;
$$;

-- Gastos do mês por categoria (valor devido de todas as saídas do mês) ---------------
create or replace function public.spending_by_category(p_user uuid, p_month date)
returns table (category_id uuid, total_cents bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select t.category_id, sum(t.due_cents)::bigint
  from public.transactions_with_status t
  where t.user_id = p_user
    and t.type = 'expense'
    and t.due_date >= date_trunc('month', p_month)::date
    and t.due_date < (date_trunc('month', p_month) + interval '1 month')::date
  group by t.category_id
  order by 2 desc;
$$;

-- Gastos do mês por forma de pagamento ----------------------------------------------
create or replace function public.spending_by_payment_method(p_user uuid, p_month date)
returns table (payment_method_id uuid, total_cents bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select t.payment_method_id, sum(t.due_cents)::bigint
  from public.transactions_with_status t
  where t.user_id = p_user
    and t.type = 'expense'
    and t.due_date >= date_trunc('month', p_month)::date
    and t.due_date < (date_trunc('month', p_month) + interval '1 month')::date
  group by t.payment_method_id
  order by 2 desc;
$$;

-- Entradas e saídas dos últimos N meses (terminando no mês de referência) -------------
create or replace function public.monthly_history(p_user uuid, p_month date, p_months integer default 6)
returns table (month date, income_cents bigint, expense_cents bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    m::date,
    coalesce(sum(t.due_cents) filter (where t.type = 'income'), 0)::bigint,
    coalesce(sum(t.due_cents) filter (where t.type = 'expense'), 0)::bigint
  from generate_series(
    date_trunc('month', p_month) - make_interval(months => greatest(p_months, 1) - 1),
    date_trunc('month', p_month),
    interval '1 month'
  ) as m
  left join public.transactions_with_status t
    on t.user_id = p_user
   and t.due_date >= m::date
   and t.due_date < (m + interval '1 month')::date
  group by m
  order by m;
$$;

revoke execute on function
  public.dashboard_summary(uuid, date),
  public.spending_by_category(uuid, date),
  public.spending_by_payment_method(uuid, date),
  public.monthly_history(uuid, date, integer)
from public, anon;

grant execute on function
  public.dashboard_summary(uuid, date),
  public.spending_by_category(uuid, date),
  public.spending_by_payment_method(uuid, date),
  public.monthly_history(uuid, date, integer)
to authenticated;

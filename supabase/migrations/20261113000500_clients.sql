-- S5 · Clientes e vendas a prazo/parceladas.
-- Referência: docs/DATA_MODEL.md ("clients", "transactions.client_id", "client_balances").

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  phone text check (phone is null or char_length(phone) <= 30),
  notes text check (notes is null or char_length(notes) <= 500),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- alvo da FK composta de transactions: o cliente precisa ser do mesmo dono do lançamento
  unique (id, user_id)
);

comment on table public.clients is 'Clientes para quem o usuário vende (ex.: moto parcelada). Cada usuário tem os seus.';

create index clients_user_name_idx on public.clients (user_id, lower(name));

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- Vínculo do lançamento com o cliente (só entradas) -------------------------------
alter table public.transactions
  add column client_id uuid,
  add constraint transactions_client_fkey
    foreign key (client_id, user_id)
    references public.clients (id, user_id),
  add constraint transactions_client_only_income
    check (client_id is null or type = 'income');

create index transactions_client_due_idx on public.transactions (client_id, due_date)
  where client_id is not null;

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
  t.recurrence_id,
  t.client_id
from public.transactions t;

-- RLS ------------------------------------------------------------------------
alter table public.clients enable row level security;

create policy "clients: ler os próprios ou admin lê todos"
  on public.clients for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "clients: criar os próprios"
  on public.clients for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "clients: alterar os próprios"
  on public.clients for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "clients: excluir os próprios"
  on public.clients for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.clients from anon;
revoke all on public.clients from authenticated;
grant select, insert, delete on public.clients to authenticated;
grant update (name, phone, notes, archived_at) on public.clients to authenticated;

grant update (client_id) on public.transactions to authenticated;

-- Saldos por cliente ------------------------------------------------------------
-- security invoker: respeita o RLS de quem chama (o admin lê de todos, os outros só os seus).
create or replace function public.client_balances(p_user uuid)
returns table (
  client_id uuid,
  sold_cents bigint,
  interest_cents bigint,
  received_cents bigint,
  remaining_cents bigint,
  overdue_cents bigint,
  overdue_count integer,
  open_count integer,
  next_due_date date
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    t.client_id,
    coalesce(sum(t.amount_cents), 0)::bigint,
    coalesce(sum(t.interest_cents), 0)::bigint,
    coalesce(sum(t.paid_cents), 0)::bigint,
    coalesce(sum(t.remaining_cents) filter (where t.status <> 'paid'), 0)::bigint,
    coalesce(sum(t.remaining_cents) filter (where t.effective_status = 'overdue'), 0)::bigint,
    (count(*) filter (where t.effective_status = 'overdue'))::integer,
    (count(*) filter (where t.status <> 'paid'))::integer,
    min(t.due_date) filter (where t.status <> 'paid')
  from public.transactions_with_status t
  where t.user_id = p_user
    and t.client_id is not null
  group by t.client_id;
$$;

revoke execute on function public.client_balances(uuid) from public, anon;
grant execute on function public.client_balances(uuid) to authenticated;

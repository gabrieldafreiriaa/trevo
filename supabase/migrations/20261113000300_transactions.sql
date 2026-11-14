-- S3 · Lançamentos (entradas e saídas), situação efetiva e normalização de pagamento.
-- Referência: docs/DATA_MODEL.md ("transactions", "View", "Regras de negócio").
-- `recurrence_id` entra no S4 e `client_id` no S5 (dependem de tabelas que ainda não existem).

-- updated_at genérico -------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- "Hoje" no fuso de São Paulo (fonte única no banco) --------------------------
create or replace function public.today_sp()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'America/Sao_Paulo')::date;
$$;

-- Tabela ---------------------------------------------------------------------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.transaction_type not null,
  description text not null check (char_length(trim(description)) between 1 and 80),
  amount_cents bigint not null check (amount_cents > 0),
  interest_cents bigint not null default 0 check (interest_cents >= 0),
  paid_cents bigint not null default 0 check (paid_cents >= 0),
  status public.transaction_status not null default 'pending',
  due_date date not null,
  paid_at date,
  category_id uuid not null,
  payment_method_id uuid,
  installment_group_id uuid,
  installment_number smallint,
  installment_total smallint,
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Categoria e forma de pagamento precisam ser do MESMO usuário (e a categoria, do mesmo tipo).
  constraint transactions_category_fkey
    foreign key (category_id, user_id, type)
    references public.categories (id, user_id, type),
  constraint transactions_payment_method_fkey
    foreign key (payment_method_id, user_id)
    references public.payment_methods (id, user_id),

  constraint transactions_paid_le_due
    check (paid_cents <= amount_cents + interest_cents),
  constraint transactions_status_consistent check (
    (status = 'paid' and paid_cents = amount_cents + interest_cents)
    or (status = 'pending' and paid_cents = 0)
    or (status = 'partial' and paid_cents > 0 and paid_cents < amount_cents + interest_cents)
  ),
  constraint transactions_expense_has_payment_method
    check (type = 'income' or payment_method_id is not null),
  constraint transactions_installments_all_or_none check (
    (installment_group_id is null and installment_number is null and installment_total is null)
    or (
      installment_group_id is not null
      and installment_total between 1 and 48
      and installment_number between 1 and installment_total
    )
  )
);

comment on table public.transactions is 'Lançamentos de entrada e saída. Valores em centavos. Atrasado é derivado (ver transactions_with_status).';

create index transactions_user_due_idx on public.transactions (user_id, due_date);
create index transactions_installment_group_idx on public.transactions (installment_group_id)
  where installment_group_id is not null;
create index transactions_category_idx on public.transactions (category_id);
create index transactions_payment_method_idx on public.transactions (payment_method_id)
  where payment_method_id is not null;

-- Normaliza situação × valor pago ------------------------------------------------
-- Regras (docs/DATA_MODEL.md):
--  · pago      → paid_cents = valor devido; paid_at = hoje se vazio
--  · pendente  → paid_cents = 0; paid_at = null
--  · parcial   → se já cobre o valor devido, vira pago; se zerou, vira pendente
create or replace function public.sync_paid_status()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_due bigint := new.amount_cents + new.interest_cents;
begin
  if new.status = 'partial' then
    if new.paid_cents >= v_due then
      new.status := 'paid';
    elsif new.paid_cents <= 0 then
      new.status := 'pending';
    end if;
  end if;

  if new.status = 'paid' then
    new.paid_cents := v_due;
    new.paid_at := coalesce(new.paid_at, public.today_sp());
  elsif new.status = 'pending' then
    new.paid_cents := 0;
    new.paid_at := null;
  else
    new.paid_at := coalesce(new.paid_at, public.today_sp());
  end if;

  return new;
end;
$$;

create trigger transactions_sync_paid_status
  before insert or update on public.transactions
  for each row execute function public.sync_paid_status();

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- View com a situação efetiva --------------------------------------------------
create view public.transactions_with_status
with (security_invoker = true)
as
select
  t.*,
  (t.amount_cents + t.interest_cents) as due_cents,
  (t.amount_cents + t.interest_cents - t.paid_cents) as remaining_cents,
  case
    when t.status in ('pending', 'partial') and t.due_date < public.today_sp() then 'overdue'
    else t.status::text
  end as effective_status
from public.transactions t;

comment on view public.transactions_with_status is 'Lançamentos + valor devido, restante e situação efetiva (overdue calculado). Respeita o RLS (security_invoker).';

-- RLS ------------------------------------------------------------------------
alter table public.transactions enable row level security;

create policy "transactions: ler os próprios ou admin lê todos"
  on public.transactions for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "transactions: criar os próprios"
  on public.transactions for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "transactions: alterar os próprios"
  on public.transactions for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "transactions: excluir os próprios"
  on public.transactions for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.transactions, public.transactions_with_status from anon;
revoke all on public.transactions from authenticated;
grant select, insert, delete on public.transactions to authenticated;
grant update (
  type, description, amount_cents, interest_cents, paid_cents, status, due_date, paid_at,
  category_id, payment_method_id, notes
) on public.transactions to authenticated;
grant select on public.transactions_with_status to authenticated;

revoke execute on function public.today_sp() from public, anon;
grant execute on function public.today_sp() to authenticated;

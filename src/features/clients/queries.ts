import "server-only";

import type { TransactionRow } from "@/features/transactions/queries";
import type { EffectiveStatus } from "@/features/transactions/status";
import type { Database, Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type Client = Tables<"clients">;
export type ClientBalance =
  Database["public"]["Functions"]["client_balances"]["Returns"][number];

const EMPTY_BALANCE = {
  sold_cents: 0,
  interest_cents: 0,
  received_cents: 0,
  remaining_cents: 0,
  overdue_cents: 0,
  overdue_count: 0,
  open_count: 0,
  next_due_date: null,
};

/** Clientes do PRÓPRIO usuário, com os saldos. */
export async function listClients(userId: string) {
  const supabase = await createClient();
  const [clients, balances] = await Promise.all([
    supabase.from("clients").select("*").eq("user_id", userId).order("name"),
    supabase.rpc("client_balances", { p_user: userId }),
  ]);
  if (clients.error) throw clients.error;
  if (balances.error) throw balances.error;

  const byClient = new Map(balances.data.map((b) => [b.client_id, b]));
  return clients.data.map((c) => ({
    ...c,
    balance: byClient.get(c.id) ?? { client_id: c.id, ...EMPTY_BALANCE },
  }));
}

export async function getClient(userId: string, id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Carnê: todas as entradas ligadas ao cliente, da mais antiga para a mais nova. */
export async function listClientTransactions(userId: string, clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions_with_status")
    .select("*")
    .eq("user_id", userId)
    .eq("client_id", clientId)
    .order("due_date")
    .order("installment_number");
  if (error) throw error;
  return data.map(
    (v) =>
      ({
        ...v,
        due_cents: v.due_cents ?? 0,
        remaining_cents: v.remaining_cents ?? 0,
        effective_status: (v.effective_status ?? v.status) as EffectiveStatus,
      }) as TransactionRow,
  );
}

export function summarize(rows: TransactionRow[]) {
  const s = { ...EMPTY_BALANCE, next_due_date: null as string | null };
  for (const r of rows) {
    s.sold_cents += r.amount_cents;
    s.interest_cents += r.interest_cents;
    s.received_cents += r.paid_cents;
    if (r.status !== "paid") {
      s.remaining_cents += r.remaining_cents;
      s.open_count += 1;
      if (!s.next_due_date || r.due_date < s.next_due_date)
        s.next_due_date = r.due_date;
    }
    if (r.effective_status === "overdue") {
      s.overdue_cents += r.remaining_cents;
      s.overdue_count += 1;
    }
  }
  return s;
}

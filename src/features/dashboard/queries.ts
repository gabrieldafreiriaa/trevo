import "server-only";

import type { TransactionRow } from "@/features/transactions/queries";
import { getOptions } from "@/features/transactions/queries";
import type { EffectiveStatus } from "@/features/transactions/status";
import { addDays, monthRange, today, type MonthKey } from "@/lib/dates";
import type { Views } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

function toRow(v: Views<"transactions_with_status">): TransactionRow {
  return {
    ...(v as unknown as TransactionRow),
    due_cents: v.due_cents ?? 0,
    remaining_cents: v.remaining_cents ?? 0,
    effective_status: (v.effective_status ?? v.status) as EffectiveStatus,
  };
}

const EMPTY_SUMMARY = {
  income_realized: 0,
  expense_realized: 0,
  income_due: 0,
  expense_due: 0,
  to_receive: 0,
  to_pay: 0,
  prev_balance_realized: 0,
  overdue_count: 0,
  overdue_cents: 0,
  clients_to_receive: 0,
  clients_overdue: 0,
};

/** Tudo o que o dashboard do mês precisa, numa leva de consultas em paralelo. */
export async function getDashboard(userId: string, month: MonthKey) {
  const supabase = await createClient();
  const { start } = monthRange(month);
  const now = today();

  const [summary, byCategory, byMethod, history, upcoming, recent, options] =
    await Promise.all([
      supabase.rpc("dashboard_summary", { p_user: userId, p_month: start }),
      supabase.rpc("spending_by_category", { p_user: userId, p_month: start }),
      supabase.rpc("spending_by_payment_method", {
        p_user: userId,
        p_month: start,
      }),
      supabase.rpc("monthly_history", {
        p_user: userId,
        p_month: start,
        p_months: 6,
      }),
      // Próximos vencimentos: o que está em aberto até daqui a 15 dias (inclui atrasados).
      supabase
        .from("transactions_with_status")
        .select("*")
        .eq("user_id", userId)
        .neq("status", "paid")
        .lte("due_date", addDays(now, 15))
        .order("due_date")
        .limit(6),
      supabase
        .from("transactions_with_status")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "paid")
        .order("paid_at", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(5),
      getOptions(userId),
    ]);

  for (const r of [summary, byCategory, byMethod, history, upcoming, recent]) {
    if (r.error) throw r.error;
  }

  return {
    summary: summary.data?.[0] ?? EMPTY_SUMMARY,
    byCategory: byCategory.data ?? [],
    byMethod: byMethod.data ?? [],
    history: history.data ?? [],
    upcoming: (upcoming.data ?? []).map(toRow),
    recent: (recent.data ?? []).map(toRow),
    options,
  };
}

export type Dashboard = Awaited<ReturnType<typeof getDashboard>>;

/** Variação percentual do saldo contra o mês anterior (null quando não dá para comparar). */
export function balanceChange(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

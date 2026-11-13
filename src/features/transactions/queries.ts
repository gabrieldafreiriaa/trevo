import "server-only";

import { monthRange, type MonthKey } from "@/lib/dates";
import type { Tables, Views } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

import {
  STATUS_PARAM,
  type EffectiveStatus,
  type StoredStatus,
  type TransactionType,
} from "./status";

export type Transaction = Tables<"transactions">;

/** Linha da view, com os campos calculados já sem `null`. */
export type TransactionRow = Transaction & {
  due_cents: number;
  remaining_cents: number;
  effective_status: EffectiveStatus;
};

export type MonthFilters = {
  type?: TransactionType;
  status?: EffectiveStatus;
  categoryId?: string;
  paymentMethodId?: string;
};

type ViewRow = Views<"transactions_with_status">;

function toRow(v: ViewRow): TransactionRow {
  // A view nunca devolve esses campos nulos; o gerador de tipos marca tudo de view como opcional.
  return {
    ...(v as unknown as Transaction),
    due_cents: v.due_cents ?? 0,
    remaining_cents: v.remaining_cents ?? 0,
    effective_status: (v.effective_status ?? v.status) as EffectiveStatus,
  };
}

/** Lançamentos do PRÓPRIO usuário no mês, com filtros. */
export async function listMonthTransactions(
  userId: string,
  month: MonthKey,
  filters: MonthFilters = {},
): Promise<TransactionRow[]> {
  const { start, end } = monthRange(month);
  const supabase = await createClient();

  let query = supabase
    .from("transactions_with_status")
    .select("*")
    .eq("user_id", userId)
    .gte("due_date", start)
    .lte("due_date", end);

  if (filters.type) query = query.eq("type", filters.type);
  if (filters.status) query = query.eq("effective_status", filters.status);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.paymentMethodId)
    query = query.eq("payment_method_id", filters.paymentMethodId);

  const { data, error } = await query
    .order("due_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(toRow);
}

export async function getTransaction(userId: string, id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions_with_status")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toRow(data) : null;
}

export type FormOptions = {
  categories: Pick<
    Tables<"categories">,
    "id" | "name" | "type" | "icon" | "color" | "archived_at"
  >[];
  paymentMethods: Pick<
    Tables<"payment_methods">,
    "id" | "name" | "kind" | "archived_at"
  >[];
};

/**
 * Categorias e formas para o formulário e para a lista.
 * Inclui as arquivadas (a lista precisa do nome delas; o formulário as esconde,
 * exceto a que o lançamento editado já usa).
 */
export async function getOptions(userId: string): Promise<FormOptions> {
  const supabase = await createClient();
  const [categories, paymentMethods] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, type, icon, color, archived_at")
      .eq("user_id", userId)
      .order("name"),
    supabase
      .from("payment_methods")
      .select("id, name, kind, archived_at")
      .eq("user_id", userId)
      .order("name"),
  ]);
  if (categories.error) throw categories.error;
  if (paymentMethods.error) throw paymentMethods.error;
  return { categories: categories.data, paymentMethods: paymentMethods.data };
}

/** Totais do mês a partir das linhas (S6 troca por função SQL no dashboard). */
export function monthTotals(rows: TransactionRow[]) {
  const t = {
    incomeRealized: 0,
    expenseRealized: 0,
    incomeDue: 0,
    expenseDue: 0,
  };
  for (const r of rows) {
    if (r.type === "income") {
      t.incomeRealized += r.paid_cents;
      t.incomeDue += r.due_cents;
    } else {
      t.expenseRealized += r.paid_cents;
      t.expenseDue += r.due_cents;
    }
  }
  return {
    ...t,
    balanceRealized: t.incomeRealized - t.expenseRealized,
    balancePredicted: t.incomeDue - t.expenseDue,
  };
}

export const STATUS_FILTERS: EffectiveStatus[] = Object.keys(
  STATUS_PARAM,
) as EffectiveStatus[];
export type { StoredStatus };

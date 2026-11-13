import type { ISODate } from "@/lib/dates";
import type { Cents } from "@/lib/money";
import type { Enums } from "@/lib/supabase/database.types";

export type TransactionType = Enums<"transaction_type">;
export type StoredStatus = Enums<"transaction_status">;
/** Situação exibida: a gravada + "atrasado", que é calculado (docs/DATA_MODEL.md). */
export type EffectiveStatus = StoredStatus | "overdue";

/** Espelha a coluna `effective_status` da view transactions_with_status. */
export function effectiveStatus(
  status: StoredStatus,
  dueDate: ISODate,
  today: ISODate,
): EffectiveStatus {
  return status !== "paid" && dueDate < today ? "overdue" : status;
}

export function dueCents(t: {
  amount_cents: Cents;
  interest_cents: Cents;
}): Cents {
  return t.amount_cents + t.interest_cents;
}

export function remainingCents(t: {
  amount_cents: Cents;
  interest_cents: Cents;
  paid_cents: Cents;
}): Cents {
  return dueCents(t) - t.paid_cents;
}

export function statusLabel(
  status: EffectiveStatus,
  type: TransactionType,
): string {
  switch (status) {
    case "paid":
      return type === "income" ? "Recebido" : "Pago";
    case "pending":
      return "Pendente";
    case "partial":
      return "Parcial";
    case "overdue":
      return "Atrasado";
  }
}

/** Classes das pílulas (tokens de docs/DESIGN.md). */
export const STATUS_PILL: Record<EffectiveStatus, string> = {
  paid: "bg-status-paid text-status-paid-foreground",
  pending: "bg-status-pending text-status-pending-foreground",
  partial: "bg-status-partial text-status-partial-foreground",
  overdue: "bg-status-overdue text-status-overdue-foreground",
};

/** Filtros de situação na URL (?situacao=...). */
export const STATUS_PARAM: Record<EffectiveStatus, string> = {
  paid: "pago",
  pending: "pendente",
  partial: "parcial",
  overdue: "atrasado",
};

export function statusFromParam(value: unknown): EffectiveStatus | undefined {
  const entry = Object.entries(STATUS_PARAM).find(([, v]) => v === value);
  return entry?.[0] as EffectiveStatus | undefined;
}

export const TYPE_PARAM: Record<TransactionType, string> = {
  expense: "saidas",
  income: "entradas",
};

export function typeFromParam(value: unknown): TransactionType | undefined {
  if (value === "saidas") return "expense";
  if (value === "entradas") return "income";
  return undefined;
}

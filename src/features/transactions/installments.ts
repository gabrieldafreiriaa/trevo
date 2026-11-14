import {
  installmentDueDates,
  type InstallmentInterval,
  type ISODate,
} from "@/lib/dates";
import { splitInstallments, type Cents } from "@/lib/money";

export type AmountMode = "total" | "each";

export type InstallmentPlanInput = {
  /** Valor digitado: o total da compra/venda ou o valor de cada parcela (ver `mode`). */
  amountCents: Cents;
  mode: AmountMode;
  count: number;
  firstDate: ISODate;
  interval: InstallmentInterval;
};

export type PlannedInstallment = {
  number: number;
  amount_cents: Cents;
  due_date: ISODate;
};

/**
 * Monta as parcelas: valores (sem perder centavos) + vencimentos.
 * - mode "total": divide o total; o resto dos centavos vai para a 1ª parcela.
 * - mode "each": todas as parcelas com o mesmo valor digitado.
 */
export function buildInstallments(
  input: InstallmentPlanInput,
): PlannedInstallment[] {
  const { amountCents, mode, count, firstDate, interval } = input;
  const amounts =
    mode === "total"
      ? count === 1
        ? [amountCents]
        : splitInstallments(amountCents, count)
      : Array.from({ length: count }, () => amountCents);
  const dates = installmentDueDates(firstDate, count, interval);
  return amounts.map((amount_cents, i) => ({
    number: i + 1,
    amount_cents,
    due_date: dates[i],
  }));
}

export function planTotal(plan: PlannedInstallment[]): Cents {
  return plan.reduce((sum, p) => sum + p.amount_cents, 0);
}

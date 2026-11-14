import type { InstallmentInterval, ISODate } from "@/lib/dates";
import type { Cents } from "@/lib/money";

import {
  buildInstallments,
  planTotal,
  type AmountMode,
  type PlannedInstallment,
} from "../transactions/installments";

export type SalePlanInput = {
  /** Valor digitado: o TOTAL da venda (com a entrada) ou o valor de CADA parcela. */
  amountCents: Cents;
  mode: AmountMode;
  count: number;
  firstDate: ISODate;
  interval: InstallmentInterval;
  /** Entrada (sinal); 0 se não houver. */
  downPaymentCents: Cents;
};

export type SalePlan = {
  installments: PlannedInstallment[];
  /** Quanto fica para as parcelas (total − entrada). */
  financedCents: Cents;
  /** Total da venda: entrada + parcelas. */
  totalCents: Cents;
};

/**
 * Monta a venda.
 * - "total": o valor digitado JÁ inclui a entrada. As parcelas dividem o que sobra.
 *   Ex.: total R$ 3.000, entrada R$ 500, 5x → 5 parcelas de R$ 500 (total continua R$ 3.000).
 * - "each": cada parcela tem o valor digitado; o total é entrada + parcelas.
 * Retorna `null` se a entrada não deixar nada para parcelar.
 */
export function buildSalePlan(input: SalePlanInput): SalePlan | null {
  const { amountCents, mode, count, firstDate, interval, downPaymentCents } =
    input;

  if (mode === "total") {
    const financed = amountCents - downPaymentCents;
    if (financed <= 0) return null;
    const installments = buildInstallments({
      amountCents: financed,
      mode,
      count,
      firstDate,
      interval,
    });
    return { installments, financedCents: financed, totalCents: amountCents };
  }

  const installments = buildInstallments({
    amountCents,
    mode,
    count,
    firstDate,
    interval,
  });
  const financed = planTotal(installments);
  return {
    installments,
    financedCents: financed,
    totalCents: financed + downPaymentCents,
  };
}

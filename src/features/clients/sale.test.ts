import { describe, expect, it } from "vitest";

import { buildSalePlan } from "./sale";

const monthly = { kind: "monthly" } as const;

describe("buildSalePlan", () => {
  it("total de R$ 3.000 com R$ 500 de entrada em 5x: parcelas de R$ 500, total R$ 3.000", () => {
    const plan = buildSalePlan({
      amountCents: 300000,
      mode: "total",
      count: 5,
      firstDate: "2026-12-10",
      interval: monthly,
      downPaymentCents: 50000,
    });
    expect(plan?.installments.map((p) => p.amount_cents)).toEqual(
      Array(5).fill(50000),
    );
    expect(plan?.financedCents).toBe(250000);
    expect(plan?.totalCents).toBe(300000);
  });

  it("sem entrada, o total é dividido inteiro", () => {
    const plan = buildSalePlan({
      amountCents: 100000,
      mode: "total",
      count: 3,
      firstDate: "2026-12-10",
      interval: monthly,
      downPaymentCents: 0,
    });
    expect(plan?.installments.map((p) => p.amount_cents)).toEqual([
      33334, 33333, 33333,
    ]);
    expect(plan?.totalCents).toBe(100000);
  });

  it("valor de cada parcela: a entrada soma por fora", () => {
    const plan = buildSalePlan({
      amountCents: 130000,
      mode: "each",
      count: 5,
      firstDate: "2026-12-10",
      interval: monthly,
      downPaymentCents: 200000,
    });
    expect(plan?.financedCents).toBe(650000);
    expect(plan?.totalCents).toBe(850000);
  });

  it("entrada igual ou maior que o total não deixa nada para parcelar", () => {
    const base = {
      amountCents: 300000,
      mode: "total" as const,
      count: 5,
      firstDate: "2026-12-10",
      interval: monthly,
    };
    expect(buildSalePlan({ ...base, downPaymentCents: 300000 })).toBeNull();
    expect(buildSalePlan({ ...base, downPaymentCents: 350000 })).toBeNull();
  });
});

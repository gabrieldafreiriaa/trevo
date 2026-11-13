import { describe, expect, it } from "vitest";

import { buildInstallments, planTotal } from "./installments";

describe("buildInstallments", () => {
  it("TV de R$ 1.000 em 3x no cartão (total), mensal", () => {
    const plan = buildInstallments({
      amountCents: 100000,
      mode: "total",
      count: 3,
      firstDate: "2026-11-20",
      interval: { kind: "monthly" },
    });
    expect(plan).toEqual([
      { number: 1, amount_cents: 33334, due_date: "2026-11-20" },
      { number: 2, amount_cents: 33333, due_date: "2026-12-20" },
      { number: 3, amount_cents: 33333, due_date: "2027-01-20" },
    ]);
    expect(planTotal(plan)).toBe(100000);
  });

  it("moto do Pedro: 5x de R$ 1.300 (valor de cada parcela)", () => {
    const plan = buildInstallments({
      amountCents: 130000,
      mode: "each",
      count: 5,
      firstDate: "2026-12-10",
      interval: { kind: "monthly" },
    });
    expect(plan.map((p) => p.amount_cents)).toEqual(Array(5).fill(130000));
    expect(plan.at(-1)?.due_date).toBe("2027-04-10");
    expect(planTotal(plan)).toBe(650000);
  });

  it("quinzenal e a cada N dias", () => {
    const quinzenal = buildInstallments({
      amountCents: 30000,
      mode: "total",
      count: 2,
      firstDate: "2026-11-20",
      interval: { kind: "biweekly" },
    });
    expect(quinzenal.map((p) => p.due_date)).toEqual([
      "2026-11-20",
      "2026-12-05",
    ]);

    const aPrazo = buildInstallments({
      amountCents: 50000,
      mode: "total",
      count: 1,
      firstDate: "2026-11-22",
      interval: { kind: "days", every: 10 },
    });
    expect(aPrazo).toEqual([
      { number: 1, amount_cents: 50000, due_date: "2026-11-22" },
    ]);
  });
});

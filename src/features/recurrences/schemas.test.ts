import { describe, expect, it } from "vitest";

import { recurrenceSchema } from "./schemas";

const base = {
  type: "expense",
  description: "Aluguel",
  amount_cents: "140000",
  category_id: "4b0b6a4e-7c1e-4d5b-9b1f-0d6b2a3f9c11",
  payment_method_id: "7a1c2d3e-4f50-4a6b-8c7d-9e0f1a2b3c4d",
  day_of_month: "5",
  starts_on: "2026-11-05",
  ends_on: "",
};

describe("recurrenceSchema", () => {
  it("aceita uma conta fixa sem data de fim", () => {
    const r = recurrenceSchema.safeParse(base);
    expect(r.success).toBe(true);
    expect(r.data).toMatchObject({
      amount_cents: 140000,
      day_of_month: 5,
      ends_on: null,
    });
  });

  it("dia entre 1 e 31", () => {
    expect(
      recurrenceSchema.safeParse({ ...base, day_of_month: "0" }).success,
    ).toBe(false);
    expect(
      recurrenceSchema.safeParse({ ...base, day_of_month: "32" }).success,
    ).toBe(false);
  });

  it("fim não pode ser antes do início", () => {
    const r = recurrenceSchema.safeParse({ ...base, ends_on: "2026-10-01" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path).toEqual(["ends_on"]);
  });

  it("saída exige forma de pagamento", () => {
    expect(
      recurrenceSchema.safeParse({ ...base, payment_method_id: "" }).success,
    ).toBe(false);
    expect(
      recurrenceSchema.safeParse({
        ...base,
        type: "income",
        payment_method_id: "",
      }).success,
    ).toBe(true);
  });
});

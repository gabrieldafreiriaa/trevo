import { describe, expect, it } from "vitest";

import { repeatSchema, toInterval, transactionSchema } from "./schemas";

const base = {
  type: "expense",
  amount_cents: "15000",
  description: " Feira ",
  category_id: "4b0b6a4e-7c1e-4d5b-9b1f-0d6b2a3f9c11",
  payment_method_id: "7a1c2d3e-4f50-4a6b-8c7d-9e0f1a2b3c4d",
  due_date: "2026-11-10",
  status: "paid",
  paid_cents: "",
  interest_cents: "",
  notes: "",
};

describe("transactionSchema", () => {
  it("aceita uma saída paga e converte os campos", () => {
    const r = transactionSchema.safeParse(base);
    expect(r.success).toBe(true);
    expect(r.data).toMatchObject({
      amount_cents: 15000,
      description: "Feira",
      interest_cents: 0,
      paid_cents: 0,
      notes: null,
    });
  });

  it("aceita valor digitado com máscara", () => {
    const r = transactionSchema.safeParse({
      ...base,
      amount_cents: "R$ 1.300,00",
    });
    expect(r.data?.amount_cents).toBe(130000);
  });

  it("exige valor positivo", () => {
    expect(
      transactionSchema.safeParse({ ...base, amount_cents: "0" }).success,
    ).toBe(false);
    expect(
      transactionSchema.safeParse({ ...base, amount_cents: "" }).success,
    ).toBe(false);
  });

  it("saída precisa de forma de pagamento; entrada não", () => {
    const semForma = { ...base, payment_method_id: "" };
    const r = transactionSchema.safeParse(semForma);
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path).toEqual(["payment_method_id"]);
    expect(
      transactionSchema.safeParse({ ...semForma, type: "income" }).success,
    ).toBe(true);
  });

  it("parcial precisa de um valor pago entre zero e o devido (com juros)", () => {
    const parcial = { ...base, status: "partial", interest_cents: "1000" };
    expect(
      transactionSchema.safeParse({ ...parcial, paid_cents: "0" }).success,
    ).toBe(false);
    expect(
      transactionSchema.safeParse({ ...parcial, paid_cents: "16000" }).success,
    ).toBe(false);
    const ok = transactionSchema.safeParse({ ...parcial, paid_cents: "15500" });
    expect(ok.success).toBe(true);
    expect(ok.data?.paid_cents).toBe(15500);
  });

  it("ignora valor pago quando não é parcial", () => {
    const r = transactionSchema.safeParse({
      ...base,
      status: "pending",
      paid_cents: "500",
    });
    expect(r.data?.paid_cents).toBe(0);
  });

  it("recusa data inválida", () => {
    expect(
      transactionSchema.safeParse({ ...base, due_date: "2026-02-30" }).success,
    ).toBe(false);
  });
});

describe("repeatSchema", () => {
  it("parcelado mensal", () => {
    const r = repeatSchema.safeParse({
      repeat: "installments",
      installment_count: "10",
      amount_mode: "total",
      interval_kind: "monthly",
      interval_days: "",
    });
    expect(r.success).toBe(true);
    if (r.success && r.data.repeat === "installments") {
      expect(r.data.installment_count).toBe(10);
      expect(toInterval(r.data)).toEqual({ kind: "monthly" });
    }
  });

  it("a cada N dias exige N", () => {
    const r = repeatSchema.parse({
      repeat: "installments",
      installment_count: "3",
      amount_mode: "each",
      interval_kind: "days",
      interval_days: "",
    });
    expect(r.repeat === "installments" && toInterval(r)).toBeNull();
  });

  it("recusa 1 ou mais de 48 parcelas", () => {
    const base = {
      repeat: "installments",
      amount_mode: "total",
      interval_kind: "monthly",
    };
    expect(
      repeatSchema.safeParse({ ...base, installment_count: "1" }).success,
    ).toBe(false);
    expect(
      repeatSchema.safeParse({ ...base, installment_count: "49" }).success,
    ).toBe(false);
  });
});

describe("cliente no lançamento", () => {
  const cliente = "9c1d2e3f-4a5b-4c6d-8e7f-0a1b2c3d4e5f";
  it("fica na entrada e some na saída", () => {
    const entrada = transactionSchema.parse({
      ...base,
      type: "income",
      client_id: cliente,
    });
    expect(entrada.client_id).toBe(cliente);
    const saida = transactionSchema.parse({ ...base, client_id: cliente });
    expect(saida.client_id).toBeNull();
  });
  it("é opcional", () => {
    expect(
      transactionSchema.parse({ ...base, type: "income" }).client_id,
    ).toBeNull();
  });
});

import { describe, expect, it } from "vitest";

import { clientSchema, saleSchema, whatsappLink } from "./schemas";

describe("clientSchema", () => {
  it("aceita só o nome", () => {
    const r = clientSchema.safeParse({
      name: " Pedro ",
      phone: "",
      notes: "  ",
    });
    expect(r.data).toEqual({ name: "Pedro", phone: null, notes: null });
  });
  it("exige nome", () => {
    expect(clientSchema.safeParse({ name: "" }).success).toBe(false);
  });
});

describe("saleSchema", () => {
  const base = {
    description: "Moto CG 160",
    amount_cents: "130000",
    amount_mode: "each",
    installment_count: "5",
    first_date: "2026-12-10",
    interval_kind: "monthly",
    interval_days: "",
    category_id: "4b0b6a4e-7c1e-4d5b-9b1f-0d6b2a3f9c11",
    payment_method_id: "",
  };

  it("aceita a moto do Pedro em 5x", () => {
    const r = saleSchema.safeParse(base);
    expect(r.success).toBe(true);
    expect(r.data).toMatchObject({
      amount_cents: 130000,
      installment_count: 5,
      payment_method_id: null,
    });
  });

  it("aceita venda a prazo em 1 vez, a cada N dias", () => {
    const r = saleSchema.safeParse({
      ...base,
      installment_count: "1",
      interval_kind: "days",
      interval_days: "10",
    });
    expect(r.success).toBe(true);
  });

  it("entrada opcional: exige valor e data quando marcada", () => {
    const semEntrada = saleSchema.parse(base);
    expect(semEntrada.has_down_payment).toBe(false);

    const incompleta = saleSchema.safeParse({
      ...base,
      has_down_payment: "on",
      down_amount_cents: "",
      down_date: "",
    });
    expect(incompleta.success).toBe(false);

    const ok = saleSchema.parse({
      ...base,
      has_down_payment: "on",
      down_amount_cents: "200000",
      down_date: "2026-11-13",
      down_payment_method_id: "",
      down_status: "paid",
    });
    expect(ok).toMatchObject({
      has_down_payment: true,
      down_amount_cents: 200000,
      down_status: "paid",
    });
  });

  it("a cada N dias exige N", () => {
    const r = saleSchema.safeParse({
      ...base,
      interval_kind: "days",
      interval_days: "",
    });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path).toEqual(["interval_days"]);
  });
});

describe("whatsappLink", () => {
  it("monta o link com +55", () => {
    expect(whatsappLink("(11) 99999-0000")).toBe("https://wa.me/5511999990000");
    expect(whatsappLink("+55 11 99999-0000")).toBe(
      "https://wa.me/5511999990000",
    );
  });
  it("ignora telefone vazio ou curto", () => {
    expect(whatsappLink(null)).toBeNull();
    expect(whatsappLink("1234")).toBeNull();
  });
});

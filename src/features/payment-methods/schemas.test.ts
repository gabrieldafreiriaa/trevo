import { describe, expect, it } from "vitest";

import { paymentMethodSchema } from "./schemas";

describe("paymentMethodSchema", () => {
  it("aceita um cartão com nome próprio", () => {
    const r = paymentMethodSchema.safeParse({
      name: " Cartão Nubank ",
      kind: "credit_card",
    });
    expect(r.success).toBe(true);
    expect(r.data?.name).toBe("Cartão Nubank");
  });

  it("recusa tipo desconhecido e nome vazio", () => {
    expect(
      paymentMethodSchema.safeParse({ name: "Vale", kind: "voucher" }).success,
    ).toBe(false);
    expect(
      paymentMethodSchema.safeParse({ name: "", kind: "pix" }).success,
    ).toBe(false);
  });
});

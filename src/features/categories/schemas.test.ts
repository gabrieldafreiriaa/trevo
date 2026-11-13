import { describe, expect, it } from "vitest";

import { createCategorySchema } from "./schemas";

describe("createCategorySchema", () => {
  const valid = {
    name: "  Moto ",
    type: "expense",
    color: "#22c55e",
    icon: "car",
  };

  it("aceita e apara o nome", () => {
    const r = createCategorySchema.safeParse(valid);
    expect(r.success).toBe(true);
    expect(r.data?.name).toBe("Moto");
  });

  it("recusa nome vazio ou longo demais", () => {
    expect(
      createCategorySchema.safeParse({ ...valid, name: "   " }).success,
    ).toBe(false);
    expect(
      createCategorySchema.safeParse({ ...valid, name: "x".repeat(41) })
        .success,
    ).toBe(false);
  });

  it("só aceita cores e ícones da lista", () => {
    expect(
      createCategorySchema.safeParse({ ...valid, color: "#000000" }).success,
    ).toBe(false);
    expect(
      createCategorySchema.safeParse({ ...valid, icon: "skull" }).success,
    ).toBe(false);
  });

  it("exige o tipo", () => {
    expect(
      createCategorySchema.safeParse({ ...valid, type: "transfer" }).success,
    ).toBe(false);
  });
});

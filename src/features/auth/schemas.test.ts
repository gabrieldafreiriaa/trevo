import { describe, expect, it } from "vitest";

import { safeNextPath, setPasswordSchema, signInSchema } from "./schemas";

describe("safeNextPath", () => {
  it.each([
    ["/lancamentos", "/lancamentos"],
    ["/clientes?x=1", "/clientes?x=1"],
    [undefined, "/"],
    ["", "/"],
    ["https://site-malicioso.com", "/"],
    ["//site-malicioso.com", "/"],
    ["/\\site-malicioso.com", "/"],
  ])("%j → %j", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });
});

describe("schemas de autenticação", () => {
  it("valida o login", () => {
    expect(
      signInSchema.safeParse({ email: "a@b.com", password: "x" }).success,
    ).toBe(true);
    expect(
      signInSchema.safeParse({ email: "nao-e-email", password: "x" }).success,
    ).toBe(false);
  });

  it("exige senha com 8+ caracteres e confirmação igual", () => {
    expect(
      setPasswordSchema.safeParse({ password: "12345678", confirm: "12345678" })
        .success,
    ).toBe(true);
    expect(
      setPasswordSchema.safeParse({ password: "1234567", confirm: "1234567" })
        .success,
    ).toBe(false);
    const diff = setPasswordSchema.safeParse({
      password: "12345678",
      confirm: "87654321",
    });
    expect(diff.success).toBe(false);
    expect(diff.error?.issues[0]?.path).toEqual(["confirm"]);
  });
});

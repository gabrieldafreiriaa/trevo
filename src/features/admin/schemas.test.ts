import { describe, expect, it } from "vitest";

import { inviteSchema } from "./schemas";

describe("inviteSchema", () => {
  it("normaliza o e-mail", () => {
    expect(
      inviteSchema.parse({ full_name: " Pai ", email: " Pai@Email.com " }),
    ).toEqual({
      full_name: "Pai",
      email: "pai@email.com",
    });
  });
  it("recusa e-mail inválido e nome vazio", () => {
    expect(
      inviteSchema.safeParse({ full_name: "Pai", email: "pai" }).success,
    ).toBe(false);
    expect(
      inviteSchema.safeParse({ full_name: "", email: "a@b.com" }).success,
    ).toBe(false);
  });
});

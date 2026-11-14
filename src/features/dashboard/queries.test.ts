import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const { balanceChange } = await import("./queries");

describe("balanceChange", () => {
  it("calcula a variação contra o mês anterior", () => {
    expect(balanceChange(2080, 1857)).toBe(12);
    expect(balanceChange(500, 1000)).toBe(-50);
  });
  it("compara bem com saldo anterior negativo", () => {
    expect(balanceChange(500, -1000)).toBe(150);
  });
  it("sem mês anterior não há variação", () => {
    expect(balanceChange(500, 0)).toBeNull();
  });
});

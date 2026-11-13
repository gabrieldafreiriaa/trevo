import { describe, expect, it } from "vitest";

import {
  dueCents,
  effectiveStatus,
  remainingCents,
  statusFromParam,
  statusLabel,
} from "./status";

describe("effectiveStatus", () => {
  const today = "2026-11-12";
  it("pendente ou parcial com vencimento passado vira atrasado", () => {
    expect(effectiveStatus("pending", "2026-11-11", today)).toBe("overdue");
    expect(effectiveStatus("partial", "2026-10-30", today)).toBe("overdue");
  });
  it("vencendo hoje ainda não está atrasado", () => {
    expect(effectiveStatus("pending", "2026-11-12", today)).toBe("pending");
  });
  it("pago nunca atrasa", () => {
    expect(effectiveStatus("paid", "2020-01-01", today)).toBe("paid");
  });
});

describe("valores", () => {
  it("valor devido inclui juros e o restante desconta o pago", () => {
    const t = { amount_cents: 130000, interest_cents: 6500, paid_cents: 50000 };
    expect(dueCents(t)).toBe(136500);
    expect(remainingCents(t)).toBe(86500);
  });
});

describe("rótulos", () => {
  it("pago vira 'Recebido' nas entradas", () => {
    expect(statusLabel("paid", "income")).toBe("Recebido");
    expect(statusLabel("paid", "expense")).toBe("Pago");
    expect(statusLabel("overdue", "income")).toBe("Atrasado");
  });
  it("lê o filtro da URL", () => {
    expect(statusFromParam("atrasado")).toBe("overdue");
    expect(statusFromParam("xyz")).toBeUndefined();
  });
});

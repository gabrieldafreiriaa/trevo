import { describe, expect, it } from "vitest";
import {
  addMonths,
  currentMonth,
  dateInMonth,
  formatDateBR,
  formatMonthBR,
  isValidISODate,
  monthRange,
  shiftMonth,
  today,
} from "./dates";

describe("today / currentMonth (America/Sao_Paulo)", () => {
  it("usa o dia de São Paulo, não o UTC", () => {
    // 01:30 UTC de 13/11 ainda é 22:30 de 12/11 em São Paulo (UTC−3).
    const now = new Date("2026-11-13T01:30:00Z");
    expect(today(now)).toBe("2026-11-12");
  });

  it("vira o dia à meia-noite de São Paulo", () => {
    expect(today(new Date("2026-11-13T03:00:00Z"))).toBe("2026-11-13");
  });

  it("vira o mês no fuso certo", () => {
    expect(currentMonth(new Date("2026-12-01T02:59:00Z"))).toBe("2026-11");
    expect(currentMonth(new Date("2026-12-01T03:00:00Z"))).toBe("2026-12");
  });
});

describe("isValidISODate", () => {
  it.each(["2026-02-28", "2028-02-29", "2026-12-31"])("aceita %s", (d) => {
    expect(isValidISODate(d)).toBe(true);
  });
  it.each(["2026-02-29", "2026-13-01", "2026-00-10", "26-1-1", "2026-04-31"])(
    "rejeita %s",
    (d) => {
      expect(isValidISODate(d)).toBe(false);
    },
  );
});

describe("addMonths", () => {
  it("mantém o dia quando existe", () => {
    expect(addMonths("2026-11-15", 1)).toBe("2026-12-15");
    expect(addMonths("2026-11-15", 3)).toBe("2027-02-15");
  });

  it("usa o último dia quando o dia não existe no mês", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29");
    expect(addMonths("2026-03-31", 1)).toBe("2026-04-30");
  });

  it("volta ao dia original depois de um mês curto", () => {
    // Cada parcela é calculada a partir da data da primeira, não da anterior.
    expect(addMonths("2026-01-31", 2)).toBe("2026-03-31");
  });

  it("aceita valores negativos", () => {
    expect(addMonths("2026-01-15", -1)).toBe("2025-12-15");
  });
});

describe("dateInMonth / shiftMonth / monthRange", () => {
  it("limita o dia ao fim do mês", () => {
    expect(dateInMonth("2026-02", 31)).toBe("2026-02-28");
    expect(dateInMonth("2026-11", 5)).toBe("2026-11-05");
  });

  it("anda entre anos", () => {
    expect(shiftMonth("2026-11", 2)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-06", -6)).toBe("2025-12");
  });

  it("retorna o intervalo do mês", () => {
    expect(monthRange("2026-02")).toEqual({
      start: "2026-02-01",
      end: "2026-02-28",
    });
  });

  it("rejeita entradas inválidas", () => {
    expect(() => dateInMonth("2026-13", 1)).toThrow(RangeError);
    expect(() => dateInMonth("2026-11", 0)).toThrow(RangeError);
  });
});

describe("formatação", () => {
  it("formata datas e meses em pt-BR", () => {
    expect(formatDateBR("2026-11-05")).toBe("05/11/2026");
    expect(formatMonthBR("2026-11")).toBe("novembro de 2026");
    expect(formatMonthBR("2027-03")).toBe("março de 2027");
  });
});

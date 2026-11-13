import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  currentHour,
  currentMonth,
  dateInMonth,
  formatDateBR,
  formatMonthBR,
  installmentDueDates,
  isValidISODate,
  monthRange,
  parseMonthParam,
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

describe("addDays", () => {
  it("soma dias atravessando mês e ano", () => {
    expect(addDays("2026-11-12", 10)).toBe("2026-11-22");
    expect(addDays("2026-11-25", 10)).toBe("2026-12-05");
    expect(addDays("2026-12-28", 5)).toBe("2027-01-02");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("installmentDueDates", () => {
  it("mensal: mesmo dia, ajustando o fim do mês", () => {
    expect(installmentDueDates("2026-12-10", 5, { kind: "monthly" })).toEqual([
      "2026-12-10",
      "2027-01-10",
      "2027-02-10",
      "2027-03-10",
      "2027-04-10",
    ]);
    expect(installmentDueDates("2027-01-31", 3, { kind: "monthly" })).toEqual([
      "2027-01-31",
      "2027-02-28",
      "2027-03-31",
    ]);
  });

  it("quinzenal: a cada 15 dias", () => {
    expect(installmentDueDates("2026-11-20", 3, { kind: "biweekly" })).toEqual([
      "2026-11-20",
      "2026-12-05",
      "2026-12-20",
    ]);
  });

  it("a cada N dias, inclusive venda a prazo em uma vez", () => {
    expect(
      installmentDueDates("2026-11-22", 3, { kind: "days", every: 10 }),
    ).toEqual(["2026-11-22", "2026-12-02", "2026-12-12"]);
    expect(
      installmentDueDates("2026-11-22", 1, { kind: "days", every: 10 }),
    ).toEqual(["2026-11-22"]);
  });

  it("valida os parâmetros", () => {
    expect(() =>
      installmentDueDates("2026-11-22", 0, { kind: "monthly" }),
    ).toThrow(RangeError);
    expect(() =>
      installmentDueDates("2026-11-22", 49, { kind: "monthly" }),
    ).toThrow(RangeError);
    expect(() =>
      installmentDueDates("2026-11-22", 2, { kind: "days", every: 0 }),
    ).toThrow(RangeError);
    expect(() =>
      installmentDueDates("2026-02-30", 2, { kind: "monthly" }),
    ).toThrow(RangeError);
  });
});

describe("parseMonthParam", () => {
  const now = new Date("2026-11-12T15:00:00Z");
  it("aceita um mês válido", () => {
    expect(parseMonthParam("2027-02", now)).toBe("2027-02");
  });
  it.each([undefined, "", "2026-13", "nov", ["2026-10"]])(
    "usa o mês atual quando recebe %j",
    (v) => {
      expect(parseMonthParam(v as string | undefined, now)).toBe("2026-11");
    },
  );
});

describe("currentHour", () => {
  it("usa a hora de São Paulo", () => {
    expect(currentHour(new Date("2026-11-13T01:30:00Z"))).toBe(22);
    expect(currentHour(new Date("2026-11-12T03:00:00Z"))).toBe(0);
  });
});

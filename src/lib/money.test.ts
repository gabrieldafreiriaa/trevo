import { describe, expect, it } from "vitest";
import {
  formatBRL,
  isCents,
  parseBRL,
  splitInstallments,
  sumCents,
} from "./money";

const NBSP = " ";

describe("formatBRL", () => {
  it("formata centavos no padrão brasileiro", () => {
    expect(formatBRL(123456)).toBe(`R$${NBSP}1.234,56`);
    expect(formatBRL(0)).toBe(`R$${NBSP}0,00`);
    expect(formatBRL(5)).toBe(`R$${NBSP}0,05`);
  });

  it("usa o sinal tipográfico em negativos", () => {
    expect(formatBRL(-9990)).toBe(`−R$${NBSP}99,90`);
  });

  it("aceita a opção signed para entradas e saídas", () => {
    expect(formatBRL(620000, { signed: true })).toBe(`+ R$${NBSP}6.200,00`);
    expect(formatBRL(-31240, { signed: true })).toBe(`− R$${NBSP}312,40`);
    expect(formatBRL(0, { signed: true })).toBe(`R$${NBSP}0,00`);
  });

  it("rejeita valores que não são centavos inteiros", () => {
    expect(() => formatBRL(10.5)).toThrow(TypeError);
  });
});

describe("parseBRL", () => {
  it.each([
    ["1.234,56", 123456],
    ["R$ 1.234,56", 123456],
    [`R$${NBSP}1.234,56`, 123456],
    ["1234,56", 123456],
    ["1234,5", 123450],
    ["1234", 123400],
    ["0,99", 99],
    ["1.000.000", 100000000],
  ])("%s → %i centavos", (input, expected) => {
    expect(parseBRL(input)).toBe(expected);
  });

  it.each(["", "abc", "-10", "1,234", "12.34", "1.23,45", "1,999", "10,"])(
    "rejeita %j",
    (input) => {
      expect(parseBRL(input)).toBeNull();
    },
  );
});

describe("splitInstallments", () => {
  it("uma parcela só (venda a prazo) devolve o total", () => {
    expect(splitInstallments(130000, 1)).toEqual([130000]);
  });

  it("divide sem resto", () => {
    expect(splitInstallments(124000, 10)).toEqual(Array(10).fill(12400));
  });

  it("coloca o resto dos centavos na primeira parcela", () => {
    expect(splitInstallments(1000, 3)).toEqual([334, 333, 333]);
    expect(splitInstallments(10001, 2)).toEqual([5001, 5000]);
  });

  it("a soma das parcelas é sempre o total", () => {
    for (const [total, n] of [
      [99999, 7],
      [100, 48],
      [123457, 12],
    ] as const) {
      expect(sumCents(splitInstallments(total, n))).toBe(total);
    }
  });

  it("valida o número de parcelas e o total", () => {
    expect(() => splitInstallments(1000, 0)).toThrow(RangeError);
    expect(() => splitInstallments(1000, 49)).toThrow(RangeError);
    expect(() => splitInstallments(1000, 2.5)).toThrow(RangeError);
    expect(() => splitInstallments(0, 2)).toThrow(RangeError);
  });
});

describe("isCents", () => {
  it("aceita só inteiros seguros", () => {
    expect(isCents(100)).toBe(true);
    expect(isCents(-100)).toBe(true);
    expect(isCents(1.5)).toBe(false);
    expect(isCents(Number.NaN)).toBe(false);
    expect(isCents("100")).toBe(false);
  });
});

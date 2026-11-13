/**
 * Datas no Trevo.
 *
 * - O fuso de referência é sempre America/Sao_Paulo ("hoje" e "mês atual").
 * - Datas de calendário (vencimento, pagamento) são strings ISO "yyyy-MM-dd",
 *   iguais ao tipo `date` do Postgres. Não carregam hora nem fuso, então não
 *   "pulam" de dia ao serem convertidas.
 * - Meses são strings "yyyy-MM".
 */
export const TIME_ZONE = "America/Sao_Paulo";

export type ISODate = string; // yyyy-MM-dd
export type MonthKey = string; // yyyy-MM

type DateParts = { year: number; month: number; day: number };

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_KEY = /^(\d{4})-(\d{2})$/;

const pad = (n: number, size = 2) => String(n).padStart(size, "0");

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function toISODate({ year, month, day }: DateParts): ISODate {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

export function isValidISODate(value: string): boolean {
  const m = ISO_DATE.exec(value);
  if (!m) return false;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return (
    month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month)
  );
}

export function parseISODate(value: ISODate): DateParts {
  if (!isValidISODate(value)) {
    throw new RangeError(`Data inválida: ${value}`);
  }
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

function parseMonthKey(value: MonthKey): { year: number; month: number } {
  const m = MONTH_KEY.exec(value);
  const month = m ? Number(m[2]) : 0;
  if (!m || month < 1 || month > 12) {
    throw new RangeError(`Mês inválido: ${value}`);
  }
  return { year: Number(m[1]), month };
}

/** "Hoje" no fuso de São Paulo, como "yyyy-MM-dd". */
export function today(now: Date = new Date()): ISODate {
  // en-CA formata como yyyy-MM-dd.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Mês atual no fuso de São Paulo, como "yyyy-MM". */
export function currentMonth(now: Date = new Date()): MonthKey {
  return monthOf(today(now));
}

export function monthOf(date: ISODate): MonthKey {
  const { year, month } = parseISODate(date);
  return `${pad(year, 4)}-${pad(month)}`;
}

/** Data no mês informado; se o dia não existir (31 em fevereiro), usa o último dia. */
export function dateInMonth(month: MonthKey, day: number): ISODate {
  const { year, month: m } = parseMonthKey(month);
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    throw new RangeError(`Dia inválido: ${day}`);
  }
  return toISODate({
    year,
    month: m,
    day: Math.min(day, daysInMonth(year, m)),
  });
}

export function shiftMonth(month: MonthKey, amount: number): MonthKey {
  const { year, month: m } = parseMonthKey(month);
  const index = year * 12 + (m - 1) + amount;
  return `${pad(Math.floor(index / 12), 4)}-${pad((index % 12) + 1)}`;
}

/**
 * Soma meses mantendo o dia original quando possível.
 * 2026-01-31 + 1 mês → 2026-02-28 (último dia de fevereiro).
 */
export function addMonths(date: ISODate, amount: number): ISODate {
  const { day } = parseISODate(date);
  return dateInMonth(shiftMonth(monthOf(date), amount), day);
}

/** Primeiro e último dia do mês, inclusivos. */
export function monthRange(month: MonthKey): { start: ISODate; end: ISODate } {
  const { year, month: m } = parseMonthKey(month);
  return {
    start: toISODate({ year, month: m, day: 1 }),
    end: toISODate({ year, month: m, day: daysInMonth(year, m) }),
  };
}

/** "2026-11-12" → "12/11/2026" */
export function formatDateBR(date: ISODate): string {
  const { year, month, day } = parseISODate(date);
  return `${pad(day)}/${pad(month)}/${year}`;
}

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "2026-11" → "novembro de 2026" */
export function formatMonthBR(month: MonthKey): string {
  const { year, month: m } = parseMonthKey(month);
  return monthFormatter.format(new Date(Date.UTC(year, m - 1, 1)));
}

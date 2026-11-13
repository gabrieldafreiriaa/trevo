/**
 * Dinheiro no Trevo é sempre um inteiro em CENTAVOS.
 * No banco: `bigint`. No TypeScript: `number` inteiro (seguro até ~90 trilhões de reais).
 * Converta para texto só na borda (exibição) e de texto só na entrada (formulários).
 */
export type Cents = number;

export const MIN_INSTALLMENTS = 1;
export const MAX_INSTALLMENTS = 48;

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const MINUS = "−"; // sinal de menos tipográfico (−)

export function isCents(value: unknown): value is Cents {
  return typeof value === "number" && Number.isSafeInteger(value);
}

export function assertCents(value: number): asserts value is Cents {
  if (!isCents(value)) {
    throw new TypeError(`Valor em centavos inválido: ${value}`);
  }
}

type FormatOptions = {
  /** Prefixa "+ " para positivos e "− " para negativos (usado em entradas e saídas). */
  signed?: boolean;
};

/** 123456 → "R$ 1.234,56". O espaço depois de "R$" é inquebrável. */
export function formatBRL(cents: Cents, options: FormatOptions = {}): string {
  assertCents(cents);
  const abs = brl.format(Math.abs(cents) / 100);
  if (options.signed) {
    if (cents > 0) return `+ ${abs}`;
    if (cents < 0) return `${MINUS} ${abs}`;
    return abs;
  }
  return cents < 0 ? `${MINUS}${abs}` : abs;
}

const BR_WITH_THOUSANDS = /^\d{1,3}(\.\d{3})+(,\d{1,2})?$/;
const BR_PLAIN = /^\d+(,\d{1,2})?$/;

/**
 * Converte o que o usuário digitou em centavos.
 * Aceita "1.234,56", "R$ 1.234,56", "1234,5", "1234" e "0,99".
 * Retorna `null` para entradas inválidas ou negativas.
 */
export function parseBRL(input: string): Cents | null {
  const text = input.replace(/R\$/gi, "").replace(/[\s ]/g, "").trim();

  if (!BR_WITH_THOUSANDS.test(text) && !BR_PLAIN.test(text)) {
    return null;
  }

  const [intPart, fracPart = ""] = text.replace(/\./g, "").split(",");
  const cents = Number(intPart) * 100 + Number(fracPart.padEnd(2, "0"));
  return isCents(cents) ? cents : null;
}

/**
 * Divide um total em parcelas sem perder centavos.
 * Cada parcela recebe floor(total / n); o resto vai para a PRIMEIRA.
 * Ex.: 1000 em 3 → [334, 333, 333].
 */
export function splitInstallments(total: Cents, count: number): Cents[] {
  assertCents(total);
  if (total <= 0) {
    throw new RangeError("O total precisa ser maior que zero.");
  }
  if (
    !Number.isInteger(count) ||
    count < MIN_INSTALLMENTS ||
    count > MAX_INSTALLMENTS
  ) {
    throw new RangeError(
      `Número de parcelas deve ser entre ${MIN_INSTALLMENTS} e ${MAX_INSTALLMENTS}.`,
    );
  }

  const base = Math.floor(total / count);
  const remainder = total - base * count;
  return Array.from({ length: count }, (_, i) =>
    i === 0 ? base + remainder : base,
  );
}

export function sumCents(values: readonly Cents[]): Cents {
  return values.reduce((acc, v) => {
    assertCents(v);
    return acc + v;
  }, 0);
}

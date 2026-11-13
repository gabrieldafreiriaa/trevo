import { z } from "zod";

import { isValidISODate } from "@/lib/dates";

/** Campo de dinheiro vindo do formulário: string só com dígitos (centavos). */
const centsField = (message: string) =>
  z.preprocess(
    (v) => (typeof v === "string" ? v.replace(/\D/g, "") : v),
    z
      .string()
      .min(1, message)
      .transform((v) => Number(v))
      .pipe(z.number().int().safe()),
  );

const optionalCentsField = z.preprocess(
  (v) => (typeof v === "string" ? v.replace(/\D/g, "") || "0" : (v ?? "0")),
  z
    .string()
    .transform((v) => Number(v))
    .pipe(z.number().int().safe().nonnegative()),
);

const emptyToNull = (v: unknown) => (v === "" || v === undefined ? null : v);

export const transactionSchema = z
  .object({
    type: z.enum(["income", "expense"], "Escolha entrada ou saída."),
    amount_cents: centsField("Digite o valor.").pipe(
      z.number().positive("O valor precisa ser maior que zero."),
    ),
    description: z
      .string()
      .trim()
      .min(1, "Descreva o lançamento.")
      .max(80, "Use no máximo 80 caracteres."),
    category_id: z.uuid("Escolha uma categoria."),
    payment_method_id: z.preprocess(emptyToNull, z.uuid().nullable()),
    due_date: z.string().refine(isValidISODate, "Escolha uma data válida."),
    status: z.enum(["paid", "pending", "partial"], "Escolha a situação."),
    paid_cents: optionalCentsField,
    interest_cents: optionalCentsField,
    notes: z.preprocess(
      emptyToNull,
      z.string().trim().max(500, "Use no máximo 500 caracteres.").nullable(),
    ),
  })
  .superRefine((v, ctx) => {
    if (v.type === "expense" && !v.payment_method_id) {
      ctx.addIssue({
        code: "custom",
        path: ["payment_method_id"],
        message: "Escolha como pagou.",
      });
    }
    if (v.status === "partial") {
      const due = v.amount_cents + v.interest_cents;
      if (v.paid_cents <= 0 || v.paid_cents >= due) {
        ctx.addIssue({
          code: "custom",
          path: ["paid_cents"],
          message:
            v.paid_cents >= due
              ? "Esse valor quita tudo: marque como pago."
              : "Digite quanto já foi pago.",
        });
      }
    }
  })
  .transform((v) => ({
    ...v,
    // O banco normaliza também (trigger sync_paid_status); aqui só evitamos lixo.
    paid_cents: v.status === "partial" ? v.paid_cents : 0,
  }));

export type TransactionInput = z.infer<typeof transactionSchema>;

export const idSchema = z.uuid("Lançamento inválido.");

/** Opções de "Repetir" do formulário de NOVO lançamento. */
export const repeatSchema = z.discriminatedUnion("repeat", [
  z.object({ repeat: z.literal("none") }),
  z.object({ repeat: z.literal("monthly") }),
  z.object({
    repeat: z.literal("installments"),
    installment_count: z.coerce
      .number("Quantas parcelas?")
      .int("Use um número inteiro.")
      .min(2, "Parcelado precisa de pelo menos 2 parcelas.")
      .max(48, "No máximo 48 parcelas."),
    amount_mode: z.enum(["total", "each"]),
    interval_kind: z.enum(["monthly", "biweekly", "days"]),
    interval_days: z.preprocess(
      (v) => (v === "" || v === undefined ? undefined : v),
      z.coerce
        .number()
        .int()
        .min(1, "Mínimo de 1 dia.")
        .max(365, "Máximo de 365 dias.")
        .optional(),
    ),
  }),
]);

export type RepeatInput = z.infer<typeof repeatSchema>;

export function toInterval(
  r: Extract<RepeatInput, { repeat: "installments" }>,
): import("@/lib/dates").InstallmentInterval | null {
  if (r.interval_kind === "monthly") return { kind: "monthly" };
  if (r.interval_kind === "biweekly") return { kind: "biweekly" };
  return r.interval_days ? { kind: "days", every: r.interval_days } : null;
}

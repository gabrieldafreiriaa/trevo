import { z } from "zod";

import { isValidISODate } from "@/lib/dates";

const emptyToNull = (v: unknown) =>
  v === "" || v === undefined || (typeof v === "string" && v.trim() === "")
    ? null
    : v;

export const clientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Digite o nome do cliente.")
    .max(80, "Use no máximo 80 caracteres."),
  phone: z.preprocess(
    emptyToNull,
    z.string().trim().max(30, "Telefone longo demais.").nullable(),
  ),
  notes: z.preprocess(
    emptyToNull,
    z.string().trim().max(500, "Use no máximo 500 caracteres.").nullable(),
  ),
});

export const saleSchema = z
  .object({
    description: z
      .string()
      .trim()
      .min(1, "O que foi vendido? Ex.: Moto CG 160")
      .max(80, "Use no máximo 80 caracteres."),
    amount_cents: z.preprocess(
      (v) => (typeof v === "string" ? v.replace(/\D/g, "") : v),
      z.coerce.number().int().positive("Digite o valor."),
    ),
    amount_mode: z.enum(["total", "each"]),
    installment_count: z.coerce
      .number("Quantas parcelas?")
      .int("Use um número inteiro.")
      .min(1, "Pelo menos 1 parcela.")
      .max(48, "No máximo 48 parcelas."),
    first_date: z
      .string()
      .refine(isValidISODate, "Escolha a data da 1ª parcela."),
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
    category_id: z.uuid("Escolha uma categoria."),
    payment_method_id: z.preprocess(
      (v) => (v === "" || v === undefined ? null : v),
      z.uuid().nullable(),
    ),
    // Entrada (sinal), opcional
    has_down_payment: z.preprocess(
      (v) => v === "on" || v === "true" || v === true,
      z.boolean(),
    ),
    down_amount_cents: z.preprocess(
      (v) => (typeof v === "string" ? v.replace(/\D/g, "") || "0" : (v ?? "0")),
      z.coerce.number().int().nonnegative(),
    ),
    down_date: z.preprocess(
      (v) => (v === "" || v === undefined ? null : v),
      z.string().nullable(),
    ),
    down_payment_method_id: z.preprocess(
      (v) => (v === "" || v === undefined ? null : v),
      z.uuid().nullable(),
    ),
    down_status: z.enum(["paid", "pending"]).default("paid"),
  })
  .superRefine((v, ctx) => {
    if (v.interval_kind === "days" && !v.interval_days) {
      ctx.addIssue({
        code: "custom",
        path: ["interval_days"],
        message: "A cada quantos dias?",
      });
    }
    if (v.has_down_payment) {
      if (v.down_amount_cents <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["down_amount_cents"],
          message: "Digite o valor da entrada.",
        });
      }
      if (!v.down_date || !isValidISODate(v.down_date)) {
        ctx.addIssue({
          code: "custom",
          path: ["down_date"],
          message: "Escolha a data da entrada.",
        });
      }
    }
  });

export type SaleInput = z.infer<typeof saleSchema>;

export const idSchema = z.uuid("Cliente inválido.");

/** Link do WhatsApp a partir do telefone digitado (assume Brasil, +55). */
export function whatsappLink(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const withCountry = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${withCountry}`;
}

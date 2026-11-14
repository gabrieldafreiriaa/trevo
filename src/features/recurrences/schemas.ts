import { z } from "zod";

import { isValidISODate } from "@/lib/dates";

const emptyToNull = (v: unknown) => (v === "" || v === undefined ? null : v);

export const recurrenceSchema = z
  .object({
    type: z.enum(["income", "expense"], "Escolha entrada ou saída."),
    description: z
      .string()
      .trim()
      .min(1, "Descreva a conta, por exemplo “Aluguel”.")
      .max(80, "Use no máximo 80 caracteres."),
    amount_cents: z.preprocess(
      (v) => (typeof v === "string" ? v.replace(/\D/g, "") : v),
      z.coerce.number().int().positive("Digite o valor."),
    ),
    category_id: z.uuid("Escolha uma categoria."),
    payment_method_id: z.preprocess(emptyToNull, z.uuid().nullable()),
    day_of_month: z.coerce
      .number("Escolha o dia.")
      .int()
      .min(1, "Dia entre 1 e 31.")
      .max(31, "Dia entre 1 e 31."),
    starts_on: z.string().refine(isValidISODate, "Escolha a data de início."),
    ends_on: z.preprocess(
      emptyToNull,
      z.string().refine(isValidISODate, "Data inválida.").nullable(),
    ),
  })
  .superRefine((v, ctx) => {
    if (v.type === "expense" && !v.payment_method_id) {
      ctx.addIssue({
        code: "custom",
        path: ["payment_method_id"],
        message: "Escolha como paga.",
      });
    }
    if (v.ends_on && v.ends_on < v.starts_on) {
      ctx.addIssue({
        code: "custom",
        path: ["ends_on"],
        message: "O fim precisa ser depois do início.",
      });
    }
  });

export type RecurrenceInput = z.infer<typeof recurrenceSchema>;

export const idSchema = z.uuid("Conta fixa inválida.");

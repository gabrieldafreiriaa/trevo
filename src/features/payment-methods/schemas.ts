import { z } from "zod";

export const paymentMethodSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Dê um nome, por exemplo “Cartão Nubank”.")
    .max(40, "Use no máximo 40 caracteres."),
  kind: z.enum(
    ["credit_card", "debit_card", "pix", "cash", "boleto", "other"],
    "Escolha o tipo.",
  ),
});

export const idSchema = z.uuid("Registro inválido.");

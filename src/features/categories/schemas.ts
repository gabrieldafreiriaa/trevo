import { z } from "zod";

import { CATEGORY_COLORS, CATEGORY_ICONS } from "./constants";

const colors = CATEGORY_COLORS.map((c) => c.value) as [string, ...string[]];
const icons = Object.keys(CATEGORY_ICONS) as [string, ...string[]];

export const categoryFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Dê um nome para a categoria.")
    .max(40, "Use no máximo 40 caracteres."),
  color: z.enum(colors, "Escolha uma cor."),
  icon: z.enum(icons, "Escolha um ícone."),
});

export const createCategorySchema = categoryFieldsSchema.extend({
  type: z.enum(["income", "expense"], "Escolha se é de entrada ou saída."),
});

export const idSchema = z.uuid("Registro inválido.");

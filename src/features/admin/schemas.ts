import { z } from "zod";

export const inviteSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, "Digite o nome.")
    .max(80, "Use no máximo 80 caracteres."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Digite um e-mail válido.")),
});

export const userIdSchema = z.uuid("Usuário inválido.");

import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Digite um e-mail válido."),
  password: z.string().min(1, "Digite sua senha."),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Digite um e-mail válido."),
});

export const MIN_PASSWORD = 8;

export const setPasswordSchema = z
  .object({
    password: z
      .string()
      .min(
        MIN_PASSWORD,
        `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`,
      ),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "As senhas não são iguais.",
    path: ["confirm"],
  });

/** Só aceita caminhos internos, para não virar um redirecionamento aberto. */
export function safeNextPath(value: unknown): string {
  if (typeof value !== "string") return "/";
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  ) {
    return "/";
  }
  return value;
}

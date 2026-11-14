/** Estado padrão devolvido pelas Server Actions de formulário. */
export type FormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  success?: string;
};

/** Converte os erros do Zod em { campo: primeira mensagem }. */
export function toFieldErrors(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

/** Códigos de erro do Postgres que viram mensagens amigáveis. */
export const PG = {
  uniqueViolation: "23505",
  foreignKeyViolation: "23503",
} as const;

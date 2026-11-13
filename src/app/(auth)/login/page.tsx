import type { Metadata } from "next";

import { FormMessage } from "@/components/form/form-field";
import { LoginForm } from "@/features/auth/components/login-form";
import { safeNextPath } from "@/features/auth/schemas";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, erro } = await searchParams;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-[-0.6px]">
          Entrar
        </h1>
        <p className="text-sm text-muted-foreground">
          Use o e-mail do seu convite.
        </p>
      </div>
      {erro === "link-invalido" ? (
        <FormMessage tone="error">
          Esse link expirou ou já foi usado. Peça um novo em “Esqueci minha
          senha”.
        </FormMessage>
      ) : null}
      <LoginForm next={safeNextPath(next)} />
    </div>
  );
}

"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/forms";

import { signIn } from "../actions";
import { FormField, FormMessage } from "@/components/form/form-field";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    signIn,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="next" value={next ?? "/"} />
      {state.error ? (
        <FormMessage tone="error">{state.error}</FormMessage>
      ) : null}

      <FormField
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="voce@email.com"
        required
        error={state.fieldErrors?.email}
      />
      <FormField
        label="Senha"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={state.fieldErrors?.password}
      />

      <Button type="submit" variant="graphite" size="lg" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </Button>

      <Link
        href="/esqueci-a-senha"
        className="self-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Esqueci minha senha
      </Link>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/forms";

import { requestPasswordReset } from "../actions";
import { FormField, FormMessage } from "@/components/form/form-field";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    requestPasswordReset,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state.success ? (
        <FormMessage tone="success">{state.success}</FormMessage>
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

      <Button type="submit" variant="graphite" size="lg" disabled={pending}>
        {pending ? "Enviando…" : "Enviar link"}
      </Button>

      <Link
        href="/login"
        className="self-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Voltar para o login
      </Link>
    </form>
  );
}

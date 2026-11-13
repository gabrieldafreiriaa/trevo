"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/forms";

import { setPassword } from "../actions";
import { MIN_PASSWORD } from "../schemas";
import { FormField, FormMessage } from "@/components/form/form-field";

export function SetPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    setPassword,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state.error ? (
        <FormMessage tone="error">{state.error}</FormMessage>
      ) : null}

      <FormField
        label="Nova senha"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD}
        required
        error={state.fieldErrors?.password}
      />
      <FormField
        label="Repita a senha"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
        error={state.fieldErrors?.confirm}
      />

      <Button type="submit" variant="graphite" size="lg" disabled={pending}>
        {pending ? "Salvando…" : "Salvar senha e entrar"}
      </Button>
    </form>
  );
}

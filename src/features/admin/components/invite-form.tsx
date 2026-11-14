"use client";

import { useActionState } from "react";

import { FormField, FormMessage } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/forms";

import { inviteUser } from "../actions";

export function InviteForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    inviteUser,
    {},
  );
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {state.error ? (
        <FormMessage tone="error">{state.error}</FormMessage>
      ) : null}
      {state.success ? (
        <FormMessage tone="success">{state.success}</FormMessage>
      ) : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Nome"
          name="full_name"
          placeholder="Ex.: João"
          autoComplete="off"
          error={errors.full_name}
        />
        <FormField
          label="E-mail"
          name="email"
          type="email"
          inputMode="email"
          placeholder="pessoa@email.com"
          autoComplete="off"
          error={errors.email}
        />
      </div>
      <Button
        type="submit"
        variant="graphite"
        disabled={pending}
        className="self-start"
      >
        {pending ? "Enviando…" : "Enviar convite"}
      </Button>
      <p className="text-[13px] text-muted-foreground">
        A pessoa recebe um e-mail com um link para criar a senha. Ela já entra
        com as categorias e formas de pagamento padrão.
      </p>
    </form>
  );
}

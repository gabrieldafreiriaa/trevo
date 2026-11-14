"use client";

import { useActionState } from "react";

import { FormField, FormMessage } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FormState } from "@/lib/forms";

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  initial: { name: string; phone: string; notes: string };
  submitLabel: string;
};

export function ClientForm({ action, initial, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {state.error ? (
        <FormMessage tone="error">{state.error}</FormMessage>
      ) : null}
      <FormField
        label="Nome"
        name="name"
        defaultValue={initial.name}
        maxLength={80}
        placeholder="Ex.: Pedro Henrique"
        autoComplete="off"
        error={errors.name}
      />
      <FormField
        label="Telefone (opcional)"
        name="phone"
        type="tel"
        inputMode="tel"
        defaultValue={initial.phone}
        maxLength={30}
        placeholder="(11) 99999-0000"
        error={errors.phone}
      />
      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Observação (opcional)</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={initial.notes}
          maxLength={500}
          placeholder="Ex.: mora no bairro tal, indicação do João"
        />
        {errors.notes ? (
          <p className="text-[13px] text-destructive">{errors.notes}</p>
        ) : null}
      </div>
      <Button type="submit" variant="graphite" size="lg" disabled={pending}>
        {pending ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";

import { FormField, FormMessage } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/forms";
import { cn } from "@/lib/utils";

import {
  PAYMENT_KIND_ORDER,
  PAYMENT_KINDS,
  type PaymentKind,
} from "../constants";

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  initial: { name: string; kind: PaymentKind };
  submitLabel: string;
};

export function PaymentMethodForm({ action, initial, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const [kind, setKind] = useState<PaymentKind>(initial.kind);
  const [name, setName] = useState(initial.name);

  const pickKind = (k: PaymentKind) => {
    // Se o nome ainda é o padrão do tipo anterior (ou vazio), acompanha a troca.
    if (!name.trim() || name === PAYMENT_KINDS[kind].label)
      setName(PAYMENT_KINDS[k].label);
    setKind(k);
  };

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {state.error ? (
        <FormMessage tone="error">{state.error}</FormMessage>
      ) : null}

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-[13px] font-medium">Tipo</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PAYMENT_KIND_ORDER.map((k) => {
            const { label, icon: Icon } = PAYMENT_KINDS[k];
            const active = kind === k;
            return (
              <label
                key={k}
                className={cn(
                  "flex h-12 cursor-pointer items-center gap-2.5 rounded-xl border px-3 text-sm has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50",
                  active
                    ? "border-graphite bg-graphite font-semibold text-graphite-foreground"
                    : "border-input bg-card text-foreground hover:bg-secondary",
                )}
              >
                <input
                  type="radio"
                  name="kind"
                  value={k}
                  checked={active}
                  onChange={() => pickKind(k)}
                  className="sr-only"
                />
                <Icon
                  className={cn("size-[18px]", active && "text-primary")}
                  aria-hidden
                />
                {label}
              </label>
            );
          })}
        </div>
        {state.fieldErrors?.kind ? (
          <p className="text-[13px] text-destructive">
            {state.fieldErrors.kind}
          </p>
        ) : null}
      </fieldset>

      <FormField
        label="Nome"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={40}
        placeholder="Ex.: Cartão Nubank, Pix Itaú"
        autoComplete="off"
        required
        error={state.fieldErrors?.name}
      />
      <p className="-mt-4 text-[13px] text-muted-foreground">
        Dica: crie um por cartão (&ldquo;Cartão Nubank&rdquo;, &ldquo;Cartão
        Itaú&rdquo;) para ver quanto gastou em cada um.
      </p>

      <Button type="submit" variant="graphite" size="lg" disabled={pending}>
        {pending ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}

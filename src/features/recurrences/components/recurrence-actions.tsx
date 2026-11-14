"use client";

import { Pause, Play } from "lucide-react";
import { useState, useTransition } from "react";

import { DeleteButton } from "@/components/form/delete-button";
import { FormMessage } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/forms";

export function RecurrenceActions({
  active,
  onToggle,
  onDelete,
}: {
  active: boolean;
  onToggle: (active: boolean) => Promise<FormState>;
  onDelete: () => Promise<FormState>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  return (
    <section className="flex flex-col gap-3 rounded-card border bg-card p-5">
      <h2 className="text-[15px] font-semibold">Outras ações</h2>
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}
      <p className="text-sm text-muted-foreground">
        Pausar ou excluir remove só os lançamentos{" "}
        <strong>futuros ainda pendentes</strong>. O que já foi pago fica no
        histórico.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const r = await onToggle(!active);
              if (r?.error) setError(r.error);
            })
          }
        >
          {active ? <Pause aria-hidden /> : <Play aria-hidden />}
          {active ? "Pausar" : "Retomar"}
        </Button>
        <DeleteButton label="Excluir conta fixa" onDelete={onDelete} />
      </div>
    </section>
  );
}

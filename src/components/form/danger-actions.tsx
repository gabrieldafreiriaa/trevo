"use client";

import { Archive, ArchiveArrowUp, Trash } from "lucide-react";
import { useState, useTransition } from "react";

import { FormMessage } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/forms";

type Props = {
  archived: boolean;
  /** Ex.: "categoria", "forma de pagamento" */
  noun: string;
  onArchive: (archived: boolean) => Promise<FormState>;
  onDelete: () => Promise<FormState>;
};

/** Arquivar/restaurar e excluir (com confirmação em dois passos). */
export function DangerActions({ archived, noun, onArchive, onDelete }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [confirming, setConfirming] = useState(false);

  const run = (fn: () => Promise<FormState>) =>
    startTransition(async () => {
      setError(undefined);
      const result = await fn();
      if (result?.error) setError(result.error);
      setConfirming(false);
    });

  return (
    <section className="flex flex-col gap-3 rounded-card border bg-card p-5">
      <h2 className="text-[15px] font-semibold">Outras ações</h2>
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}

      <p className="text-sm text-muted-foreground">
        {archived
          ? `Esta ${noun} está arquivada: não aparece mais nas opções, mas o histórico continua.`
          : `Arquivar esconde a ${noun} das opções sem apagar o histórico.`}
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => run(() => onArchive(!archived))}
        >
          {archived ? <ArchiveArrowUp aria-hidden /> : <Archive aria-hidden />}
          {archived ? "Restaurar" : "Arquivar"}
        </Button>

        {confirming ? (
          <>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => run(onDelete)}
            >
              <Trash aria-hidden />
              Confirmar exclusão
            </Button>
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() => setConfirming(false)}
            >
              Cancelar
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            className="text-expense"
            disabled={pending}
            onClick={() => setConfirming(true)}
          >
            <Trash aria-hidden />
            Excluir
          </Button>
        )}
      </div>
    </section>
  );
}

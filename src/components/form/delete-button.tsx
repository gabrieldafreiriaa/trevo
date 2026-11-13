"use client";

import { Trash } from "lucide-react";
import { useState, useTransition } from "react";

import { FormMessage } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/forms";

/** Excluir com confirmação em dois passos. */
export function DeleteButton({
  onDelete,
  label = "Excluir",
}: {
  onDelete: () => Promise<FormState>;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();

  return (
    <div className="flex flex-col gap-3">
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}
      <div className="flex flex-wrap gap-2">
        {confirming ? (
          <>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const r = await onDelete();
                  if (r?.error) setError(r.error);
                  setConfirming(false);
                })
              }
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
            onClick={() => setConfirming(true)}
          >
            <Trash aria-hidden />
            {label}
          </Button>
        )}
      </div>
    </div>
  );
}

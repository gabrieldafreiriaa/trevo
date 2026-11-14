"use client";

import { Check } from "lucide-react";
import { useTransition } from "react";

import { markAsPaid } from "../actions";

/** Botão "Pagar"/"Receber" da lista: quita o lançamento sem abrir o formulário. */
export function QuickPayButton({ id, label }: { id: string; label: string }) {
  // No celular vira só o ícone (com nome acessível), para não espremer a linha.
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => void (await markAsPaid(id)))}
      aria-label={label}
      title={label}
      className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-input bg-card text-xs font-semibold hover:bg-secondary disabled:opacity-50 sm:h-9 sm:w-auto sm:px-3"
    >
      <Check className="size-4 sm:size-3.5" strokeWidth={3} aria-hidden />
      <span className="hidden sm:inline">{pending ? "…" : label}</span>
    </button>
  );
}

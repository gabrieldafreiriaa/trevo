"use client";

import { Check } from "lucide-react";
import { useTransition } from "react";

import { markAsPaid } from "../actions";

/** Botão "Pagar"/"Receber" da lista: quita o lançamento sem abrir o formulário. */
export function QuickPayButton({ id, label }: { id: string; label: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => void (await markAsPaid(id)))}
      className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-input bg-card px-3 text-xs font-semibold hover:bg-secondary disabled:opacity-50"
    >
      <Check className="size-3.5" strokeWidth={3} aria-hidden />
      {pending ? "…" : label}
    </button>
  );
}

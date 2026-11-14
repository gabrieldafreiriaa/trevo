"use client";

import { Eye } from "lucide-react";
import { useTransition } from "react";

import { setViewAs } from "@/features/admin/actions";

/** Faixa no topo quando o admin está vendo o painel de outra pessoa. */
export function ReadOnlyBanner({ ownerName }: { ownerName: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-status-partial px-4 py-3 text-sm text-status-partial-foreground"
    >
      <span className="flex items-center gap-2">
        <Eye className="size-4 shrink-0" aria-hidden />
        <span>
          Você está vendo o painel de <strong>{ownerName}</strong>. Somente
          leitura.
        </span>
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => void (await setViewAs(null)))
        }
        className="h-11 cursor-pointer rounded-full bg-card px-3.5 text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-60 lg:h-9"
      >
        {pending ? "Voltando…" : "Voltar ao meu painel"}
      </button>
    </div>
  );
}

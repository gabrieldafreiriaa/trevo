"use client";

import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

import type { FormOptions } from "../queries";

const selectClass =
  "h-11 min-w-0 cursor-pointer rounded-full lg:h-10 border border-input bg-card px-3.5 pr-8 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-focus";

/** Filtros da lista: tudo fica na URL, então dá para voltar e compartilhar. */
export function TransactionFilters({ options }: { options: FormOptions }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const tipo = params.get("tipo") ?? "";
  const active = ["tipo", "situacao", "categoria", "forma"].some((k) =>
    params.get(k),
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        role="group"
        aria-label="Tipo"
        className="flex gap-1 rounded-full bg-secondary p-1"
      >
        {[
          ["", "Tudo"],
          ["entradas", "Entradas"],
          ["saidas", "Saídas"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={tipo === value}
            onClick={() => set("tipo", value)}
            className={cn(
              "h-10 cursor-pointer rounded-full px-3.5 text-sm font-medium lg:h-8",
              tipo === value
                ? "bg-card shadow-[0_0_0_1px_var(--border)]"
                : "text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <select
        aria-label="Situação"
        className={selectClass}
        value={params.get("situacao") ?? ""}
        onChange={(e) => set("situacao", e.target.value)}
      >
        <option value="">Toda situação</option>
        <option value="pendente">Pendentes</option>
        <option value="atrasado">Atrasados</option>
        <option value="parcial">Parciais</option>
        <option value="pago">Pagos/recebidos</option>
      </select>

      <select
        aria-label="Categoria"
        className={selectClass}
        value={params.get("categoria") ?? ""}
        onChange={(e) => set("categoria", e.target.value)}
      >
        <option value="">Toda categoria</option>
        {options.categories
          .filter(
            (c) =>
              !tipo || c.type === (tipo === "entradas" ? "income" : "expense"),
          )
          .map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.type === "income" && !tipo ? " (entrada)" : ""}
            </option>
          ))}
      </select>

      <select
        aria-label="Forma de pagamento"
        className={selectClass}
        value={params.get("forma") ?? ""}
        onChange={(e) => set("forma", e.target.value)}
      >
        <option value="">Toda forma</option>
        {options.paymentMethods.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {active ? (
        <button
          type="button"
          onClick={() => {
            const next = new URLSearchParams();
            const mes = params.get("mes");
            if (mes) next.set("mes", mes);
            router.replace(`${pathname}?${next.toString()}`, { scroll: false });
          }}
          className="inline-flex h-11 cursor-pointer items-center gap-1 rounded-full px-3 text-sm text-muted-foreground hover:text-foreground lg:h-10"
        >
          <X className="size-4" aria-hidden />
          Limpar
        </button>
      ) : null}
    </div>
  );
}

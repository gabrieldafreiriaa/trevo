"use client";

import { useId, useState } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const fmt = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 130000 → "1.300,00" */
function display(cents: number) {
  return fmt.format(cents / 100);
}

type Props = {
  name: string;
  label: string;
  defaultCents?: number;
  error?: string;
  size?: "default" | "hero";
  /** Cor do valor no modo hero (ex.: "text-expense"). */
  toneClassName?: string;
  hint?: React.ReactNode;
  onChangeCents?: (cents: number) => void;
};

/**
 * Campo de dinheiro no estilo dos apps de banco: você digita só números
 * e ele preenche da direita para a esquerda (1 → 0,01 · 130000 → 1.300,00).
 * Envia para o servidor os CENTAVOS (só dígitos) no campo `name`.
 */
export function MoneyInput({
  name,
  label,
  defaultCents = 0,
  error,
  size = "default",
  toneClassName,
  hint,
  onChangeCents,
}: Props) {
  const id = useId();
  const [cents, setCents] = useState(defaultCents);

  const update = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 13);
    const next = Number(digits || "0");
    setCents(next);
    onChangeCents?.(next);
  };

  const errorId = `${id}-error`;
  const hero = size === "hero";

  return (
    <div className={cn("flex flex-col gap-2", hero && "items-center gap-1")}>
      <Label
        htmlFor={id}
        className={cn(hero && "font-normal text-muted-foreground")}
      >
        {label}
      </Label>
      <div
        className={cn(
          "relative flex w-full items-center",
          hero && "justify-center",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "pointer-events-none text-muted-foreground",
            hero
              ? "mr-1 font-display text-2xl font-semibold"
              : "absolute left-3.5 text-[15px]",
          )}
        >
          R$
        </span>
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          value={display(cents)}
          onChange={(e) => update(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "min-w-0 bg-transparent outline-none",
            hero
              ? cn(
                  "w-[11ch] text-center font-display text-[40px] font-semibold tracking-[-1px]",
                  toneClassName,
                )
              : "h-12 w-full rounded-lg border border-input bg-card pr-3.5 pl-11 text-[15px] focus-visible:border-focus focus-visible:ring-[3px] focus-visible:ring-ring/30 aria-invalid:border-destructive",
          )}
        />
        <input type="hidden" name={name} value={String(cents)} />
      </div>
      {hint ? (
        <div className="text-[13px] text-muted-foreground">{hint}</div>
      ) : null}
      {error ? (
        <p id={errorId} className="text-[13px] text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

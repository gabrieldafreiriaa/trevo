"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Option = { value: string; label: string; icon?: ReactNode };

/** Grupo de opções em "chips" (rádio acessível por teclado). */
export function ChoiceChips({
  name,
  legend,
  options,
  value,
  onChange,
  error,
  columns,
}: {
  name: string;
  legend: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  /** Grade fixa (ex.: 3 para a situação). Sem isso, os chips quebram linha. */
  columns?: number;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-[13px] font-medium">{legend}</legend>
      <div
        className={cn(columns ? "grid gap-2" : "flex flex-wrap gap-2")}
        style={
          columns
            ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
            : undefined
        }
      >
        {options.map((o) => {
          const active = o.value === value;
          return (
            <label
              key={o.value}
              className={cn(
                "flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border px-4 text-sm transition-colors has-focus-visible:ring-[3px] has-focus-visible:ring-focus",
                active
                  ? "border-graphite bg-graphite font-semibold text-graphite-foreground"
                  : "border-input bg-card text-foreground hover:bg-secondary",
              )}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={active}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              {o.icon}
              <span className="truncate">{o.label}</span>
            </label>
          );
        })}
      </div>
      {error ? <p className="text-[13px] text-destructive">{error}</p> : null}
    </fieldset>
  );
}

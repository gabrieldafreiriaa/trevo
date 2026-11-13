import type { ReactNode } from "react";

import { formatBRL } from "@/lib/money";

export type BarItem = {
  key: string;
  label: string;
  icon?: ReactNode;
  value: number;
};

/**
 * Lista com barras horizontais (uma série só: sem legenda, o título diz o que é).
 * Barras em --chart-expense, finas, com ponta arredondada; o valor e a % ficam no texto.
 */
export function BarList({
  title,
  items,
  empty,
  max = 6,
}: {
  title: string;
  items: BarItem[];
  empty: string;
  max?: number;
}) {
  const total = items.reduce((s, i) => s + i.value, 0);
  const top = items.slice(0, max);
  const rest = items.slice(max);
  const rows = rest.length
    ? [
        ...top,
        {
          key: "outros",
          label: `Outros (${rest.length})`,
          value: rest.reduce((s, i) => s + i.value, 0),
        },
      ]
    : top;
  const biggest = Math.max(...rows.map((r) => r.value), 1);

  return (
    <section className="flex flex-col gap-4 rounded-card border bg-card p-5 lg:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[17px] font-semibold">{title}</h2>
        {total > 0 ? (
          <span className="text-sm text-muted-foreground tabular-nums">
            {formatBRL(total)}
          </span>
        ) : null}
      </div>
      {rows.length ? (
        <ul className="flex flex-col gap-3.5">
          {rows.map((r) => {
            const pct = Math.round((r.value / total) * 100);
            return (
              <li key={r.key} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    {r.icon}
                    <span className="truncate">{r.label}</span>
                  </span>
                  <span className="shrink-0 tabular-nums">
                    <span className="font-medium">{formatBRL(r.value)}</span>
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      {pct}%
                    </span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-secondary" aria-hidden>
                  <div
                    className="h-2 rounded-full bg-chart-expense"
                    style={{
                      width: `${Math.max((r.value / biggest) * 100, 2)}%`,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {empty}
        </p>
      )}
    </section>
  );
}

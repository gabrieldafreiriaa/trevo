"use client";

import { useState } from "react";

import { formatShortMonth, formatMonthBR } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

type Point = { month: string; income_cents: number; expense_cents: number };

const PLOT_H = 168;

function niceMax(v: number) {
  if (v <= 0) return 100000;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

function compact(cents: number) {
  const reais = cents / 100;
  if (reais >= 1000) return `${Math.round(reais / 1000)} mil`;
  return String(Math.round(reais));
}

/**
 * Entradas × saídas por mês: colunas agrupadas (2 séries, legenda sempre visível),
 * dica ao passar o mouse/tocar/focar, e tabela para leitores de tela.
 */
export function MonthlyChart({
  data,
  current,
}: {
  data: Point[];
  current: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const top = niceMax(
    Math.max(...data.flatMap((d) => [d.income_cents, d.expense_cents]), 0),
  );
  const ticks = [0, top / 2, top];
  const h = (v: number) => (v / top) * PLOT_H;

  return (
    <section className="flex flex-col gap-4 rounded-card border bg-card p-5 lg:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[17px] font-semibold">Últimos 6 meses</h2>
        <div className="flex gap-4 text-xs text-muted-foreground" aria-hidden>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px] bg-chart-income" />
            Entradas
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px] bg-chart-expense" />
            Saídas
          </span>
        </div>
      </div>

      <div className="flex gap-2" aria-hidden>
        <div
          className="flex flex-col justify-between pb-6 text-right text-[11px] text-muted-foreground tabular-nums"
          style={{ height: PLOT_H + 24 }}
        >
          {[...ticks].reverse().map((t) => (
            <span key={t}>{compact(t)}</span>
          ))}
        </div>
        <div className="relative flex-1">
          <div
            className="absolute inset-x-0 top-0 flex flex-col justify-between"
            style={{ height: PLOT_H }}
          >
            {ticks.map((t) => (
              <div key={t} className="h-px bg-divider" />
            ))}
          </div>
          <div
            className="relative flex items-end justify-between gap-1"
            style={{ height: PLOT_H }}
          >
            {data.map((d, i) => {
              const future = d.month.slice(0, 7) > current;
              return (
                // div (e não <button>): o Safari não aplica bem flex/altura dentro de botões.
                <div
                  key={d.month}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  onClick={() => setActive(active === i ? null : i)}
                  className={cn(
                    "relative flex h-full min-w-0 flex-1 items-end justify-center gap-[2px] rounded-md",
                    active === i && "bg-secondary/70",
                  )}
                >
                  <div
                    className={cn(
                      "w-[18px] max-w-[40%] shrink-0 rounded-t-[4px] bg-chart-income",
                      future && "opacity-50",
                    )}
                    style={{
                      height: `${Math.max(h(d.income_cents), d.income_cents ? 2 : 0)}px`,
                    }}
                  />
                  <div
                    className={cn(
                      "w-[18px] max-w-[40%] shrink-0 rounded-t-[4px] bg-chart-expense",
                      future && "opacity-50",
                    )}
                    style={{
                      height: `${Math.max(h(d.expense_cents), d.expense_cents ? 2 : 0)}px`,
                    }}
                  />
                  {active === i ? (
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 flex w-max -translate-x-1/2 flex-col gap-1 rounded-lg bg-graphite px-3 py-2 text-left text-xs text-graphite-foreground shadow-lg">
                      <span className="font-semibold first-letter:uppercase">
                        {formatMonthBR(d.month.slice(0, 7))}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-[2px] bg-chart-income" />
                        Entradas {formatBRL(d.income_cents)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-[2px] bg-chart-expense" />
                        Saídas {formatBRL(d.expense_cents)}
                      </span>
                      <span className="text-graphite-muted">
                        Saldo {formatBRL(d.income_cents - d.expense_cents)}
                      </span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between gap-1">
            {data.map((d) => (
              <span
                key={d.month}
                className={cn(
                  "flex-1 text-center text-xs",
                  d.month.slice(0, 7) === current
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {formatShortMonth(d.month)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <table className="sr-only">
        <caption>Entradas e saídas dos últimos 6 meses</caption>
        <thead>
          <tr>
            <th scope="col">Mês</th>
            <th scope="col">Entradas</th>
            <th scope="col">Saídas</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <th scope="row">{formatMonthBR(d.month.slice(0, 7))}</th>
              <td>{formatBRL(d.income_cents)}</td>
              <td>{formatBRL(d.expense_cents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

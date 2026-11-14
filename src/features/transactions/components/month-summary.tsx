import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

import type { monthTotals } from "../queries";

type Totals = ReturnType<typeof monthTotals>;

function Card({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "income" | "expense";
}) {
  return (
    <div className="flex flex-col gap-1 rounded-card border bg-card p-4">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-display text-xl font-semibold tracking-[-0.5px] tabular-nums lg:text-2xl",
          tone === "income" && "text-income",
          tone === "expense" && "text-expense",
        )}
      >
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </div>
  );
}

/** Totais do mês: realizado em destaque e o previsto como apoio. */
export function MonthSummary({ totals }: { totals: Totals }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <Card
        label="Entradas"
        tone="income"
        value={formatBRL(totals.incomeRealized)}
        hint={`Previsto ${formatBRL(totals.incomeDue)}`}
      />
      <Card
        label="Saídas"
        tone="expense"
        value={formatBRL(totals.expenseRealized)}
        hint={`Previsto ${formatBRL(totals.expenseDue)}`}
      />
      <div className="col-span-2 flex flex-col gap-1 rounded-card bg-graphite p-4 text-graphite-foreground lg:col-span-1">
        <span className="text-[13px] text-graphite-muted">Saldo</span>
        <span className="font-display text-xl font-semibold tracking-[-0.5px] tabular-nums lg:text-2xl">
          {formatBRL(totals.balanceRealized)}
        </span>
        <span className="text-xs text-graphite-muted">
          Previsto para o fim do mês {formatBRL(totals.balancePredicted)}
        </span>
      </div>
    </div>
  );
}

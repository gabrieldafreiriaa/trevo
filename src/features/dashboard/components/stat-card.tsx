import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { formatBRL } from "@/lib/money";

export function FlowCard({
  type,
  realized,
  due,
}: {
  type: "income" | "expense";
  realized: number;
  due: number;
}) {
  const income = type === "income";
  const Icon = income ? ArrowUpRight : ArrowDownRight;
  const pending = due - realized;
  return (
    <section className="flex flex-col gap-3 rounded-card border bg-card p-5">
      <span
        aria-hidden
        className={
          income
            ? "flex size-10 items-center justify-center rounded-xl bg-status-paid text-income"
            : "flex size-10 items-center justify-center rounded-xl bg-status-overdue text-expense"
        }
      >
        <Icon className="size-5" strokeWidth={2.2} />
      </span>
      <span className="text-sm text-muted-foreground">
        {income ? "Entradas" : "Saídas"}
      </span>
      <span className="font-display text-[26px] leading-none font-semibold tracking-[-0.8px] tabular-nums">
        {formatBRL(realized)}
      </span>
      <span className="text-[13px] text-muted-foreground">
        {pending > 0
          ? `+ ${formatBRL(pending)} previsto`
          : "Nada pendente no mês"}
      </span>
    </section>
  );
}

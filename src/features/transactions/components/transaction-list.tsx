import Link from "next/link";

import { CategoryIcon } from "@/features/categories/components/category-badge";
import { formatDayHeader, formatDayMonth } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

import type { FormOptions, TransactionRow } from "../queries";
import { QuickPayButton } from "./quick-pay-button";
import { StatusPill } from "./status-pill";

type Props = { rows: TransactionRow[]; options: FormOptions };

function groupByDay(rows: TransactionRow[]) {
  const groups = new Map<string, TransactionRow[]>();
  for (const r of rows) {
    const list = groups.get(r.due_date) ?? [];
    list.push(r);
    groups.set(r.due_date, list);
  }
  return [...groups.entries()];
}

export function TransactionList({ rows, options }: Props) {
  const categories = new Map(options.categories.map((c) => [c.id, c]));
  const methods = new Map(options.paymentMethods.map((p) => [p.id, p]));

  return (
    <div className="flex flex-col gap-5">
      {groupByDay(rows).map(([day, items]) => (
        <section key={day} className="flex flex-col gap-2">
          <h2 className="px-1 text-[13px] font-medium text-muted-foreground first-letter:uppercase">
            {formatDayHeader(day)}
          </h2>
          <ul className="overflow-hidden rounded-card border bg-card">
            {items.map((t) => {
              const category = categories.get(t.category_id);
              const method = t.payment_method_id
                ? methods.get(t.payment_method_id)
                : undefined;
              const income = t.type === "income";
              const open = t.status !== "paid";
              const installment =
                t.installment_total && t.installment_total > 1
                  ? `${t.installment_number}/${t.installment_total}`
                  : null;
              const meta = [category?.name, method?.name, installment]
                .filter(Boolean)
                .join(" · ");

              return (
                <li
                  key={t.id}
                  className="flex items-center gap-3 border-b border-divider px-4 py-3 last:border-b-0"
                >
                  <Link
                    href={`/lancamentos/${t.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <CategoryIcon
                      icon={category?.icon ?? "circle-ellipsis"}
                      color={category?.color ?? "#64748b"}
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-[15px] font-medium">
                        {t.description}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {meta}
                      </span>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span
                        className={cn(
                          "text-[15px] font-semibold tabular-nums",
                          income ? "text-income" : "text-foreground",
                        )}
                      >
                        {formatBRL(income ? t.due_cents : -t.due_cents, {
                          signed: true,
                        })}
                      </span>
                      {t.effective_status !== "paid" ? (
                        <StatusPill status={t.effective_status} type={t.type} />
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          {income ? "Recebido" : "Pago"}
                          {t.paid_at && t.paid_at !== t.due_date
                            ? ` em ${formatDayMonth(t.paid_at)}`
                            : ""}
                        </span>
                      )}
                    </div>
                  </Link>
                  {open ? (
                    <QuickPayButton
                      id={t.id}
                      label={income ? "Receber" : "Pagar"}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

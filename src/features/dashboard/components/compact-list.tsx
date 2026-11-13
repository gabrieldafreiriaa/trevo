import Link from "next/link";

import { CategoryIcon } from "@/features/categories/components/category-badge";
import { QuickPayButton } from "@/features/transactions/components/quick-pay-button";
import { StatusPill } from "@/features/transactions/components/status-pill";
import type {
  FormOptions,
  TransactionRow,
} from "@/features/transactions/queries";
import { formatDayMonth } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

/** Lista curta de lançamentos (próximos vencimentos / últimos pagos). */
export function CompactList({
  title,
  rows,
  options,
  empty,
  mode,
  href,
}: {
  title: string;
  rows: TransactionRow[];
  options: FormOptions;
  empty: string;
  mode: "upcoming" | "recent";
  href: string;
}) {
  const categories = new Map(options.categories.map((c) => [c.id, c]));
  const clients = new Map(options.clients.map((c) => [c.id, c.name]));

  return (
    <section className="flex flex-col rounded-card border bg-card p-5 lg:p-6">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-[17px] font-semibold">{title}</h2>
        <Link href={href} className="text-[13px] text-income hover:underline">
          Ver todos
        </Link>
      </div>
      {rows.length ? (
        <ul>
          {rows.map((t) => {
            const c = categories.get(t.category_id);
            const income = t.type === "income";
            const sub =
              (t.client_id ? clients.get(t.client_id) : undefined) ??
              c?.name ??
              "";
            return (
              <li
                key={t.id}
                className="flex items-center gap-3 border-t border-divider py-3.5 first:border-t-0 sm:gap-4"
              >
                <Link
                  href={`/lancamentos/${t.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3.5"
                >
                  {mode === "upcoming" ? (
                    <span className="flex w-11 shrink-0 flex-col items-center leading-tight">
                      <span className="font-display text-lg font-semibold">
                        {t.due_date.slice(8, 10)}
                      </span>
                      <span className="text-[11px] text-muted-foreground uppercase">
                        {formatDayMonth(t.due_date).slice(3)}
                      </span>
                    </span>
                  ) : (
                    <CategoryIcon
                      icon={c?.icon ?? "circle-ellipsis"}
                      color={c?.color ?? "#64748b"}
                    />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-sm font-medium">
                      {t.description}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {sub}
                      {mode === "recent" && t.paid_at
                        ? ` · ${formatDayMonth(t.paid_at)}`
                        : ""}
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        income && "text-income",
                      )}
                    >
                      {formatBRL(
                        income
                          ? mode === "upcoming"
                            ? t.remaining_cents
                            : t.due_cents
                          : -(mode === "upcoming"
                              ? t.remaining_cents
                              : t.due_cents),
                        { signed: true },
                      )}
                    </span>
                    {mode === "upcoming" ? (
                      <StatusPill status={t.effective_status} type={t.type} />
                    ) : null}
                  </div>
                </Link>
                {mode === "upcoming" ? (
                  <QuickPayButton
                    id={t.id}
                    label={income ? "Receber" : "Pagar"}
                  />
                ) : null}
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

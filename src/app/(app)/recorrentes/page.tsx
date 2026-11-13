import { ChevronRight, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/features/categories/components/category-badge";
import { listRecurrences } from "@/features/recurrences/queries";
import { getOptions } from "@/features/transactions/queries";
import { requireUser } from "@/lib/auth/session";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Recorrentes" };

export default async function RecorrentesPage() {
  const user = await requireUser();
  const [rules, options] = await Promise.all([
    listRecurrences(user.id),
    getOptions(user.id),
  ]);
  const categories = new Map(options.categories.map((c) => [c.id, c]));
  const methods = new Map(options.paymentMethods.map((p) => [p.id, p]));

  const monthlyIncome = rules
    .filter((r) => r.active && r.type === "income")
    .reduce((s, r) => s + r.amount_cents, 0);
  const monthlyExpense = rules
    .filter((r) => r.active && r.type === "expense")
    .reduce((s, r) => s + r.amount_cents, 0);

  return (
    <>
      <PageHeader
        title="Recorrentes"
        description="Contas fixas que se repetem todo mês. Os próximos 3 meses já aparecem como previstos."
        actions={
          <Button asChild>
            <Link href="/recorrentes/nova">
              <Plus strokeWidth={2.5} aria-hidden />
              Nova conta fixa
            </Link>
          </Button>
        }
      />

      {rules.length ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 rounded-card border bg-card p-4">
              <span className="text-[13px] text-muted-foreground">
                Entra todo mês
              </span>
              <span className="font-display text-xl font-semibold text-income tabular-nums">
                {formatBRL(monthlyIncome)}
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-card border bg-card p-4">
              <span className="text-[13px] text-muted-foreground">
                Sai todo mês
              </span>
              <span className="font-display text-xl font-semibold text-expense tabular-nums">
                {formatBRL(monthlyExpense)}
              </span>
            </div>
          </div>

          <ul className="overflow-hidden rounded-card border bg-card">
            {rules.map((r) => {
              const c = categories.get(r.category_id);
              const m = r.payment_method_id
                ? methods.get(r.payment_method_id)
                : undefined;
              return (
                <li
                  key={r.id}
                  className="border-b border-divider last:border-b-0"
                >
                  <Link
                    href={`/recorrentes/${r.id}`}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 hover:bg-secondary",
                      !r.active && "opacity-60",
                    )}
                  >
                    <CategoryIcon
                      icon={c?.icon ?? "repeat"}
                      color={c?.color ?? "#64748b"}
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-[15px] font-medium">
                        {r.description}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {[`Todo dia ${r.day_of_month}`, c?.name, m?.name]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span
                        className={cn(
                          "text-[15px] font-semibold tabular-nums",
                          r.type === "income"
                            ? "text-income"
                            : "text-foreground",
                        )}
                      >
                        {formatBRL(
                          r.type === "income"
                            ? r.amount_cents
                            : -r.amount_cents,
                          { signed: true },
                        )}
                      </span>
                      {!r.active ? (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                          Pausada
                        </span>
                      ) : null}
                    </div>
                    <ChevronRight
                      className="size-4 text-muted-foreground"
                      aria-hidden
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-input bg-card px-6 py-12 text-center">
          <p className="max-w-sm text-[15px]">
            Cadastre aluguel, internet, salário e outras contas que se repetem.
            O Trevo lança sozinho todo mês.
          </p>
          <Button asChild variant="outline">
            <Link href="/recorrentes/nova">
              <Plus aria-hidden />
              Cadastrar a primeira
            </Link>
          </Button>
        </div>
      )}
    </>
  );
}

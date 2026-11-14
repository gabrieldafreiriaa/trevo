import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";

import { MonthSwitcher } from "@/components/layout/month-switcher";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { TransactionFilters } from "@/features/transactions/components/filters";
import { MonthSummary } from "@/features/transactions/components/month-summary";
import { TransactionList } from "@/features/transactions/components/transaction-list";
import {
  getOptions,
  listMonthTransactions,
  monthTotals,
} from "@/features/transactions/queries";
import { statusFromParam, typeFromParam } from "@/features/transactions/status";
import { getViewContext } from "@/lib/auth/view";
import { formatMonthBR, parseMonthParam } from "@/lib/dates";

export const metadata: Metadata = { title: "Lançamentos" };

const uuidOrUndefined = (v: unknown) =>
  z.uuid().safeParse(v).success ? (v as string) : undefined;

export default async function LancamentosPage({
  searchParams,
}: PageProps<"/lancamentos">) {
  const ctx = await getViewContext();
  const params = await searchParams;
  const month = parseMonthParam(params.mes);
  const filters = {
    type: typeFromParam(params.tipo),
    status: statusFromParam(params.situacao),
    categoryId: uuidOrUndefined(params.categoria),
    paymentMethodId: uuidOrUndefined(params.forma),
  };
  const filtered = Object.values(filters).some(Boolean);

  const [rows, allRows, options] = await Promise.all([
    listMonthTransactions(ctx.ownerId, month, filters),
    // Totais do mês sempre sem filtro, para não confundir o saldo.
    filtered ? listMonthTransactions(ctx.ownerId, month) : null,
    getOptions(ctx.ownerId),
  ]);

  return (
    <>
      <PageHeader
        title={<MonthSwitcher month={month} />}
        actions={
          ctx.readOnly ? null : (
            <Button asChild className="hidden lg:inline-flex">
              <Link href="/lancamentos/novo">
                <Plus strokeWidth={2.5} aria-hidden />
                Novo lançamento
              </Link>
            </Button>
          )
        }
      />

      <MonthSummary totals={monthTotals(allRows ?? rows)} />

      <TransactionFilters options={options} />

      {rows.length ? (
        <TransactionList
          rows={rows}
          options={options}
          readOnly={ctx.readOnly}
        />
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-input bg-card px-6 py-12 text-center">
          <p className="text-[15px]">
            {filtered
              ? "Nenhum lançamento com esses filtros."
              : `Nenhum lançamento em ${formatMonthBR(month)}.`}
          </p>
          {!filtered && !ctx.readOnly ? (
            <Button asChild variant="outline">
              <Link href="/lancamentos/novo">
                <Plus aria-hidden />
                Lançar o primeiro
              </Link>
            </Button>
          ) : null}
        </div>
      )}
    </>
  );
}

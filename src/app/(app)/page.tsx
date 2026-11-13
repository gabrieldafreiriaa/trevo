import { Plus } from "lucide-react";
import Link from "next/link";
import { createElement } from "react";

import { MonthSwitcher } from "@/components/layout/month-switcher";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { iconFor } from "@/features/categories/constants";
import { BalanceCard } from "@/features/dashboard/components/balance-card";
import { BarList } from "@/features/dashboard/components/bar-list";
import { ClientsCard } from "@/features/dashboard/components/clients-card";
import { CompactList } from "@/features/dashboard/components/compact-list";
import { MonthlyChart } from "@/features/dashboard/components/monthly-chart";
import { FlowCard } from "@/features/dashboard/components/stat-card";
import { balanceChange, getDashboard } from "@/features/dashboard/queries";
import { PAYMENT_KINDS } from "@/features/payment-methods/constants";
import { requireUser } from "@/lib/auth/session";
import { currentHour, parseMonthParam } from "@/lib/dates";

function greeting() {
  const hour = currentHour();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  const user = await requireUser();
  const month = parseMonthParam((await searchParams).mes);
  const firstName = user.fullName.split(" ")[0];
  const d = await getDashboard(user.id, month);
  const s = d.summary;

  const balance = s.income_realized - s.expense_realized;
  const predicted = s.income_due - s.expense_due;
  const categories = new Map(d.options.categories.map((c) => [c.id, c]));
  const methods = new Map(d.options.paymentMethods.map((p) => [p.id, p]));
  const hasClients = d.options.clients.length > 0;
  const empty = s.income_due === 0 && s.expense_due === 0;

  return (
    <>
      <PageHeader
        title={
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">
              {greeting()}, {firstName}
            </span>
            <MonthSwitcher month={month} />
          </div>
        }
        actions={
          <Button asChild className="hidden lg:inline-flex">
            <Link href="/lancamentos/novo">
              <Plus strokeWidth={2.5} aria-hidden />
              Novo lançamento
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <BalanceCard
          balance={balance}
          predicted={predicted}
          toPay={s.to_pay}
          toReceive={s.to_receive}
          change={balanceChange(balance, s.prev_balance_realized)}
        />
        <FlowCard
          type="income"
          realized={s.income_realized}
          due={s.income_due}
        />
        <FlowCard
          type="expense"
          realized={s.expense_realized}
          due={s.expense_due}
        />
      </div>

      {s.overdue_count > 0 ? (
        <a
          href="#vencimentos"
          className="flex items-center justify-between gap-3 rounded-xl bg-status-overdue px-4 py-3 text-sm text-status-overdue-foreground"
        >
          <span>
            <strong>
              {s.overdue_count}{" "}
              {s.overdue_count === 1
                ? "lançamento atrasado"
                : "lançamentos atrasados"}
            </strong>{" "}
            · confira os vencimentos abaixo
          </span>
        </a>
      ) : null}

      {empty ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-input bg-card px-6 py-12 text-center">
          <p className="max-w-sm text-[15px]">
            Nenhum lançamento neste mês ainda. Comece registrando uma entrada ou
            um gasto.
          </p>
          <Button asChild variant="outline">
            <Link href="/lancamentos/novo">
              <Plus aria-hidden />
              Novo lançamento
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <BarList
            title="Gastos por categoria"
            empty="Nenhum gasto neste mês."
            items={d.byCategory.map((r) => {
              const c = categories.get(r.category_id);
              return {
                key: r.category_id,
                label: c?.name ?? "Sem categoria",
                value: r.total_cents,
                icon: createElement(iconFor(c?.icon ?? "circle-ellipsis"), {
                  className: "size-4 shrink-0",
                  style: { color: c?.color },
                  "aria-hidden": true,
                }),
              };
            })}
          />
          <BarList
            title="Gastos por forma de pagamento"
            empty="Nenhum gasto neste mês."
            items={d.byMethod.map((r) => {
              const m = r.payment_method_id
                ? methods.get(r.payment_method_id)
                : undefined;
              return {
                key: r.payment_method_id ?? "sem-forma",
                label: m?.name ?? "Não informado",
                value: r.total_cents,
                icon: m
                  ? createElement(PAYMENT_KINDS[m.kind].icon, {
                      className: "size-4 shrink-0 text-muted-foreground",
                      "aria-hidden": true,
                    })
                  : undefined,
              };
            })}
          />
        </div>
      )}

      {hasClients ? (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <MonthlyChart data={d.history} current={month} />
          <ClientsCard
            toReceive={s.clients_to_receive}
            overdue={s.clients_overdue}
          />
        </div>
      ) : (
        <MonthlyChart data={d.history} current={month} />
      )}

      <div
        id="vencimentos"
        className="grid scroll-mt-6 grid-cols-1 gap-4 lg:grid-cols-2"
      >
        <CompactList
          title="Próximos vencimentos"
          mode="upcoming"
          rows={d.upcoming}
          options={d.options}
          href="/lancamentos?situacao=pendente"
          empty="Nada para pagar ou receber nos próximos 15 dias."
        />
        <CompactList
          title="Últimos lançamentos"
          mode="recent"
          rows={d.recent}
          options={d.options}
          href="/lancamentos"
          empty="Nenhum lançamento pago ainda."
        />
      </div>
    </>
  );
}

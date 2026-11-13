import { ChevronRight, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/layout/user-badge";
import { Button } from "@/components/ui/button";
import { listClients } from "@/features/clients/queries";
import { requireUser } from "@/lib/auth/session";
import { formatDayMonth } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientesPage() {
  const user = await requireUser();
  const clients = await listClients(user.id);
  const active = clients.filter((c) => !c.archived_at);
  const archived = clients.filter((c) => c.archived_at);

  const toReceive = active.reduce((s, c) => s + c.balance.remaining_cents, 0);
  const overdue = active.reduce((s, c) => s + c.balance.overdue_cents, 0);
  const overdueClients = active.filter(
    (c) => c.balance.overdue_count > 0,
  ).length;

  const Row = ({ c }: { c: (typeof clients)[number] }) => (
    <li className="border-b border-divider last:border-b-0">
      <Link
        href={`/clientes/${c.id}`}
        className="flex items-center gap-3 px-4 py-3 hover:bg-secondary"
      >
        <Avatar name={c.name} className="size-10" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[15px] font-medium">{c.name}</span>
          <span className="truncate text-xs text-muted-foreground">
            {c.balance.open_count === 0
              ? c.balance.sold_cents > 0
                ? "Tudo pago"
                : "Sem vendas ainda"
              : `${c.balance.open_count} em aberto${
                  c.balance.next_due_date
                    ? ` · próxima ${formatDayMonth(c.balance.next_due_date)}`
                    : ""
                }`}
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {c.balance.remaining_cents > 0 ? (
            <span className="text-[15px] font-semibold text-income tabular-nums">
              {formatBRL(c.balance.remaining_cents)}
            </span>
          ) : null}
          {c.balance.overdue_count > 0 ? (
            <span className="rounded-full bg-status-overdue px-2.5 py-0.5 text-[11px] font-semibold text-status-overdue-foreground">
              {c.balance.overdue_count === 1
                ? "1 atrasada"
                : `${c.balance.overdue_count} atrasadas`}
            </span>
          ) : null}
        </div>
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
      </Link>
    </li>
  );

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Vendas parceladas e quanto cada cliente ainda deve."
        actions={
          <Button asChild>
            <Link href="/clientes/novo">
              <Plus strokeWidth={2.5} aria-hidden />
              Novo cliente
            </Link>
          </Button>
        }
      />

      {active.length ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 rounded-card border bg-card p-4">
              <span className="text-[13px] text-muted-foreground">
                A receber
              </span>
              <span className="font-display text-xl font-semibold text-income tabular-nums lg:text-2xl">
                {formatBRL(toReceive)}
              </span>
            </div>
            <div
              className={cn(
                "flex flex-col gap-1 rounded-card border p-4",
                overdue > 0
                  ? "border-transparent bg-status-overdue"
                  : "bg-card",
              )}
            >
              <span
                className={cn(
                  "text-[13px]",
                  overdue > 0
                    ? "text-status-overdue-foreground"
                    : "text-muted-foreground",
                )}
              >
                Em atraso
                {overdueClients
                  ? ` · ${overdueClients} ${overdueClients === 1 ? "cliente" : "clientes"}`
                  : ""}
              </span>
              <span
                className={cn(
                  "font-display text-xl font-semibold tabular-nums lg:text-2xl",
                  overdue > 0 && "text-status-overdue-foreground",
                )}
              >
                {formatBRL(overdue)}
              </span>
            </div>
          </div>

          <ul className="overflow-hidden rounded-card border bg-card">
            {active.map((c) => (
              <Row key={c.id} c={c} />
            ))}
          </ul>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-input bg-card px-6 py-12 text-center">
          <p className="max-w-sm text-[15px]">
            Cadastre quem compra de você parcelado. O Trevo acompanha cada
            parcela, os atrasos e os juros.
          </p>
          <Button asChild variant="outline">
            <Link href="/clientes/novo">
              <Plus aria-hidden />
              Cadastrar o primeiro
            </Link>
          </Button>
        </div>
      )}

      {archived.length ? (
        <details>
          <summary className="flex h-11 w-fit cursor-pointer items-center text-sm text-muted-foreground hover:text-foreground">
            Arquivados ({archived.length})
          </summary>
          <ul className="mt-3 overflow-hidden rounded-card border bg-card opacity-80">
            {archived.map((c) => (
              <Row key={c.id} c={c} />
            ))}
          </ul>
        </details>
      ) : null}
    </>
  );
}

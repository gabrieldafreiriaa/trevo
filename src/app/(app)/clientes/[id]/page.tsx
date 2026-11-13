import { MessageCircle, Pencil, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BackLink } from "@/components/layout/back-link";
import { Avatar } from "@/components/layout/user-badge";
import { Button } from "@/components/ui/button";
import {
  getClient,
  listClientTransactions,
  summarize,
} from "@/features/clients/queries";
import { idSchema, whatsappLink } from "@/features/clients/schemas";
import { QuickPayButton } from "@/features/transactions/components/quick-pay-button";
import { StatusPill } from "@/features/transactions/components/status-pill";
import type { TransactionRow } from "@/features/transactions/queries";
import { getViewContext } from "@/lib/auth/view";
import { RowLink } from "@/components/layout/row-link";
import { formatDateBR } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Cliente" };

/** Agrupa as parcelas por venda (installment_group_id); avulsas ficam sozinhas. */
function groupBySale(rows: TransactionRow[]) {
  const groups = new Map<string, TransactionRow[]>();
  for (const r of rows) {
    const key = r.installment_group_id ?? r.id;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  return [...groups.values()];
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-card border bg-card p-4">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-display text-lg font-semibold tabular-nums lg:text-xl",
          tone,
        )}
      >
        {value}
      </span>
    </div>
  );
}

export default async function ClientePage({
  params,
}: PageProps<"/clientes/[id]">) {
  const ctx = await getViewContext();
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();

  const [client, rows] = await Promise.all([
    getClient(ctx.ownerId, id),
    listClientTransactions(ctx.ownerId, id),
  ]);
  if (!client) notFound();

  const s = summarize(rows);
  const whatsapp = whatsappLink(client.phone);
  const interestReceived = rows
    .filter((r) => r.status === "paid")
    .reduce((sum, r) => sum + r.interest_cents, 0);

  return (
    <>
      <BackLink href="/clientes">Clientes</BackLink>

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={client.name} className="size-12 text-base" />
          <div className="flex min-w-0 flex-col">
            <h1 className="truncate font-display text-2xl font-semibold tracking-[-0.6px] lg:text-[28px]">
              {client.name}
            </h1>
            {client.phone ? (
              <span className="text-sm text-muted-foreground">
                {client.phone}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {whatsapp ? (
            <Button asChild variant="outline">
              <a href={whatsapp} target="_blank" rel="noreferrer">
                <MessageCircle aria-hidden />
                WhatsApp
              </a>
            </Button>
          ) : null}
          {ctx.readOnly ? null : (
            <Button
              asChild
              variant="outline"
              size="icon"
              aria-label="Editar cliente"
            >
              <Link href={`/clientes/${client.id}/editar`}>
                <Pencil aria-hidden />
              </Link>
            </Button>
          )}
          {ctx.readOnly ? null : (
            <Button asChild>
              <Link href={`/clientes/${client.id}/venda`}>
                <Plus strokeWidth={2.5} aria-hidden />
                Nova venda
              </Link>
            </Button>
          )}
        </div>
      </header>

      {client.notes ? (
        <p className="rounded-xl bg-secondary px-4 py-3 text-sm whitespace-pre-line text-muted-foreground">
          {client.notes}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Vendido" value={formatBRL(s.sold_cents)} />
        <Stat
          label="Recebido"
          value={formatBRL(s.received_cents)}
          tone="text-income"
        />
        <Stat label="A receber" value={formatBRL(s.remaining_cents)} />
        <Stat
          label={
            s.overdue_count ? `Em atraso (${s.overdue_count})` : "Em atraso"
          }
          value={formatBRL(s.overdue_cents)}
          tone={s.overdue_cents ? "text-expense" : undefined}
        />
      </div>
      {interestReceived > 0 ? (
        <p className="-mt-3 text-sm text-muted-foreground">
          Juros já recebidos deste cliente:{" "}
          <strong className="text-income">{formatBRL(interestReceived)}</strong>
        </p>
      ) : null}

      {rows.length ? (
        groupBySale(rows).map((sale) => {
          const first = sale[0];
          const total = sale.reduce((sum, r) => sum + r.amount_cents, 0);
          const count = first.installment_total ?? 1;
          const down = sale.find((r) => r.installment_number === 0);
          return (
            <section
              key={first.installment_group_id ?? first.id}
              className="flex flex-col gap-2"
            >
              <h2 className="flex flex-wrap items-baseline justify-between gap-2 px-1">
                <span className="text-[15px] font-semibold">
                  {first.description}
                </span>
                <span className="text-[13px] text-muted-foreground">
                  {down ? `entrada + ` : ""}
                  {count > 1 ? `${count}x · ` : ""}total {formatBRL(total)}
                </span>
              </h2>
              <ul className="overflow-hidden rounded-card border bg-card">
                {sale.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center gap-3 border-b border-divider px-4 py-3 last:border-b-0"
                  >
                    <RowLink
                      readOnly={ctx.readOnly}
                      href={`/lancamentos/${r.id}`}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <span className="w-14 shrink-0 text-center font-display text-sm font-semibold text-muted-foreground">
                        {r.installment_number === 0
                          ? "Entrada"
                          : count > 1
                            ? `${r.installment_number}/${count}`
                            : "—"}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-[15px] font-medium tabular-nums">
                          {formatBRL(r.due_cents)}
                          {r.interest_cents > 0 ? (
                            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                              (com {formatBRL(r.interest_cents)} de juros)
                            </span>
                          ) : null}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Vence {formatDateBR(r.due_date)}
                          {r.status === "partial"
                            ? ` · falta ${formatBRL(r.remaining_cents)}`
                            : ""}
                          {r.status === "paid" && r.paid_at
                            ? ` · recebido ${formatDateBR(r.paid_at)}`
                            : ""}
                        </span>
                      </div>
                      <StatusPill status={r.effective_status} type="income" />
                    </RowLink>
                    {r.status !== "paid" ? (
                      <QuickPayButton id={r.id} label="Receber" />
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-input bg-card px-6 py-12 text-center">
          <p className="text-[15px]">Nenhuma venda para {client.name} ainda.</p>
          {ctx.readOnly ? null : (
            <Button asChild variant="outline">
              <Link href={`/clientes/${client.id}/venda`}>
                <Plus aria-hidden />
                Registrar venda
              </Link>
            </Button>
          )}
        </div>
      )}

      <p className="text-[13px] text-muted-foreground">
        Para cobrar juros de uma parcela atrasada ou registrar um pagamento
        parcial, toque na parcela.
      </p>
    </>
  );
}

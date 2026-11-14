import { ChevronRight, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { RowLink } from "@/components/layout/row-link";
import { Button } from "@/components/ui/button";
import { PaymentMethodIcon } from "@/features/payment-methods/components/payment-method-icon";
import { PAYMENT_KINDS } from "@/features/payment-methods/constants";
import {
  listPaymentMethods,
  type PaymentMethod,
} from "@/features/payment-methods/queries";
import { getViewContext } from "@/lib/auth/view";

export const metadata: Metadata = { title: "Formas de pagamento" };

function Row({
  method,
  readOnly,
}: {
  method: PaymentMethod;
  readOnly: boolean;
}) {
  const kindLabel = PAYMENT_KINDS[method.kind].label;
  return (
    <RowLink
      readOnly={readOnly}
      href={`/formas-de-pagamento/${method.id}`}
      className="flex h-16 items-center gap-3 border-b border-divider px-4 last:border-b-0 hover:bg-secondary"
    >
      <PaymentMethodIcon kind={method.kind} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[15px] font-medium">{method.name}</span>
        {method.name !== kindLabel ? (
          <span className="text-xs text-muted-foreground">{kindLabel}</span>
        ) : null}
      </div>
      {readOnly ? null : (
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
      )}
    </RowLink>
  );
}

export default async function FormasDePagamentoPage() {
  const ctx = await getViewContext();
  const { active, archived } = await listPaymentMethods(ctx.ownerId);

  return (
    <>
      <PageHeader
        title="Formas de pagamento"
        description="Como você pagou ou recebeu: cartão, Pix, dinheiro…"
        actions={
          ctx.readOnly ? null : (
            <Button asChild>
              <Link href="/formas-de-pagamento/nova">
                <Plus strokeWidth={2.5} aria-hidden />
                Nova forma
              </Link>
            </Button>
          )
        }
      />

      {active.length ? (
        <div className="overflow-hidden rounded-card border bg-card">
          {active.map((m) => (
            <Row key={m.id} method={m} readOnly={ctx.readOnly} />
          ))}
        </div>
      ) : (
        <p className="rounded-card border border-dashed border-input bg-card px-6 py-10 text-center text-sm text-muted-foreground">
          {ctx.readOnly
            ? "Nenhuma forma de pagamento ativa."
            : "Nenhuma forma de pagamento ativa. Crie a primeira no botão acima."}
        </p>
      )}

      {archived.length ? (
        <details className="flex flex-col gap-3">
          <summary className="flex h-11 w-fit cursor-pointer items-center text-sm text-muted-foreground hover:text-foreground">
            Arquivadas ({archived.length})
          </summary>
          <div className="mt-3 overflow-hidden rounded-card border bg-card opacity-80">
            {archived.map((m) => (
              <Row key={m.id} method={m} readOnly={ctx.readOnly} />
            ))}
          </div>
        </details>
      ) : null}
    </>
  );
}

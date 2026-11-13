import type { Metadata } from "next";

import { BackLink } from "@/components/layout/back-link";
import { PageHeader } from "@/components/layout/page-header";
import { createPaymentMethod } from "@/features/payment-methods/actions";
import { PaymentMethodForm } from "@/features/payment-methods/components/payment-method-form";

export const metadata: Metadata = { title: "Nova forma de pagamento" };

export default function NovaFormaPage() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <BackLink href="/formas-de-pagamento">Formas de pagamento</BackLink>
      <PageHeader title="Nova forma de pagamento" />
      <div className="rounded-card border bg-card p-5 sm:p-6">
        <PaymentMethodForm
          action={createPaymentMethod}
          initial={{ name: "Cartão de crédito", kind: "credit_card" }}
          submitLabel="Criar forma de pagamento"
        />
      </div>
    </div>
  );
}

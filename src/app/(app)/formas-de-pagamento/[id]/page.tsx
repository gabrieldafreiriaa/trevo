import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DangerActions } from "@/components/form/danger-actions";
import { BackLink } from "@/components/layout/back-link";
import { PageHeader } from "@/components/layout/page-header";
import {
  deletePaymentMethod,
  setPaymentMethodArchived,
  updatePaymentMethod,
} from "@/features/payment-methods/actions";
import { PaymentMethodForm } from "@/features/payment-methods/components/payment-method-form";
import { getPaymentMethod } from "@/features/payment-methods/queries";
import { idSchema } from "@/features/payment-methods/schemas";
import { requireWritable } from "@/lib/auth/view";

export const metadata: Metadata = { title: "Editar forma de pagamento" };

export default async function EditarFormaPage({
  params,
}: PageProps<"/formas-de-pagamento/[id]">) {
  const { user } = await requireWritable();
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();

  const method = await getPaymentMethod(user.id, id);
  if (!method) notFound();

  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <BackLink href="/formas-de-pagamento">Formas de pagamento</BackLink>
      <PageHeader title="Editar forma de pagamento" />
      <div className="rounded-card border bg-card p-5 sm:p-6">
        <PaymentMethodForm
          action={updatePaymentMethod.bind(null, method.id)}
          initial={method}
          submitLabel="Salvar alterações"
        />
      </div>
      <DangerActions
        noun="forma de pagamento"
        archived={Boolean(method.archived_at)}
        onArchive={setPaymentMethodArchived.bind(null, method.id)}
        onDelete={deletePaymentMethod.bind(null, method.id)}
      />
    </div>
  );
}

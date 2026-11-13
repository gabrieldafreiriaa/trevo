import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackLink } from "@/components/layout/back-link";
import { PageHeader } from "@/components/layout/page-header";
import { createSale } from "@/features/clients/actions";
import { SaleForm } from "@/features/clients/components/sale-form";
import { getClient } from "@/features/clients/queries";
import { idSchema } from "@/features/clients/schemas";
import { getOptions } from "@/features/transactions/queries";
import { requireWritable } from "@/lib/auth/view";
import { addMonths, today } from "@/lib/dates";

export const metadata: Metadata = { title: "Nova venda" };

export default async function NovaVendaPage({
  params,
}: PageProps<"/clientes/[id]/venda">) {
  const { user } = await requireWritable();
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();
  const [client, options] = await Promise.all([
    getClient(user.id, id),
    getOptions(user.id),
  ]);
  if (!client) notFound();

  const vendas = options.categories.find(
    (c) =>
      c.type === "income" &&
      !c.archived_at &&
      c.name.toLowerCase() === "vendas",
  );

  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <BackLink href={`/clientes/${client.id}`}>{client.name}</BackLink>
      <PageHeader title="Nova venda" description={`Para ${client.name}`} />
      <div className="rounded-card border bg-card p-5 sm:p-6">
        <SaleForm
          action={createSale.bind(null, client.id)}
          options={options}
          defaultCategoryId={vendas?.id ?? ""}
          firstDate={addMonths(today(), 1)}
          today={today()}
        />
      </div>
    </div>
  );
}

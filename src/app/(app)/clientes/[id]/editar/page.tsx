import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DangerActions } from "@/components/form/danger-actions";
import { BackLink } from "@/components/layout/back-link";
import { PageHeader } from "@/components/layout/page-header";
import {
  deleteClientAction,
  setClientArchived,
  updateClientAction,
} from "@/features/clients/actions";
import { ClientForm } from "@/features/clients/components/client-form";
import { getClient } from "@/features/clients/queries";
import { idSchema } from "@/features/clients/schemas";
import { requireWritable } from "@/lib/auth/view";

export const metadata: Metadata = { title: "Editar cliente" };

export default async function EditarClientePage({
  params,
}: PageProps<"/clientes/[id]/editar">) {
  const { user } = await requireWritable();
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();
  const client = await getClient(user.id, id);
  if (!client) notFound();

  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <BackLink href={`/clientes/${client.id}`}>{client.name}</BackLink>
      <PageHeader title="Editar cliente" />
      <div className="rounded-card border bg-card p-5 sm:p-6">
        <ClientForm
          action={updateClientAction.bind(null, client.id)}
          initial={{
            name: client.name,
            phone: client.phone ?? "",
            notes: client.notes ?? "",
          }}
          submitLabel="Salvar alterações"
        />
      </div>
      <DangerActions
        noun="ficha do cliente"
        archived={Boolean(client.archived_at)}
        onArchive={setClientArchived.bind(null, client.id)}
        onDelete={deleteClientAction.bind(null, client.id)}
      />
    </div>
  );
}

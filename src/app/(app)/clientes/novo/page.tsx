import type { Metadata } from "next";

import { BackLink } from "@/components/layout/back-link";
import { PageHeader } from "@/components/layout/page-header";
import { createClientAction } from "@/features/clients/actions";
import { ClientForm } from "@/features/clients/components/client-form";
import { requireWritable } from "@/lib/auth/view";

export const metadata: Metadata = { title: "Novo cliente" };

export default async function NovoClientePage() {
  await requireWritable();
  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <BackLink href="/clientes">Clientes</BackLink>
      <PageHeader title="Novo cliente" />
      <div className="rounded-card border bg-card p-5 sm:p-6">
        <ClientForm
          action={createClientAction}
          initial={{ name: "", phone: "", notes: "" }}
          submitLabel="Cadastrar cliente"
        />
      </div>
    </div>
  );
}

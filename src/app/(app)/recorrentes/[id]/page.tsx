import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackLink } from "@/components/layout/back-link";
import { PageHeader } from "@/components/layout/page-header";
import {
  deleteRecurrence,
  setRecurrenceActive,
  updateRecurrence,
} from "@/features/recurrences/actions";
import { RecurrenceActions } from "@/features/recurrences/components/recurrence-actions";
import { RecurrenceForm } from "@/features/recurrences/components/recurrence-form";
import { getRecurrence } from "@/features/recurrences/queries";
import { idSchema } from "@/features/recurrences/schemas";
import { getOptions } from "@/features/transactions/queries";
import { requireWritable } from "@/lib/auth/view";

export const metadata: Metadata = { title: "Editar conta fixa" };

export default async function EditarRecorrentePage({
  params,
}: PageProps<"/recorrentes/[id]">) {
  const { user } = await requireWritable();
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();

  const [rule, options] = await Promise.all([
    getRecurrence(user.id, id),
    getOptions(user.id),
  ]);
  if (!rule) notFound();

  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <BackLink href="/recorrentes">Recorrentes</BackLink>
      <PageHeader
        title="Editar conta fixa"
        description="Mudanças valem para os próximos lançamentos ainda pendentes."
      />
      <div className="rounded-card border bg-card p-5 sm:p-6">
        <RecurrenceForm
          action={updateRecurrence.bind(null, rule.id)}
          options={options}
          canChangeType={false}
          submitLabel="Salvar alterações"
          initial={{
            type: rule.type,
            description: rule.description,
            amount_cents: rule.amount_cents,
            category_id: rule.category_id,
            payment_method_id: rule.payment_method_id ?? "",
            day_of_month: rule.day_of_month,
            starts_on: rule.starts_on,
            ends_on: rule.ends_on ?? "",
          }}
        />
      </div>
      <RecurrenceActions
        active={rule.active}
        onToggle={setRecurrenceActive.bind(null, rule.id)}
        onDelete={deleteRecurrence.bind(null, rule.id)}
      />
    </div>
  );
}

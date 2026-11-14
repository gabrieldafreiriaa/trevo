import type { Metadata } from "next";

import { BackLink } from "@/components/layout/back-link";
import { PageHeader } from "@/components/layout/page-header";
import { createRecurrence } from "@/features/recurrences/actions";
import { RecurrenceForm } from "@/features/recurrences/components/recurrence-form";
import { getOptions } from "@/features/transactions/queries";
import { requireWritable } from "@/lib/auth/view";
import { today } from "@/lib/dates";

export const metadata: Metadata = { title: "Nova conta fixa" };

export default async function NovaRecorrentePage() {
  const { user } = await requireWritable();
  const options = await getOptions(user.id);
  const start = today();

  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <BackLink href="/recorrentes">Recorrentes</BackLink>
      <PageHeader title="Nova conta fixa" />
      <div className="rounded-card border bg-card p-5 sm:p-6">
        <RecurrenceForm
          action={createRecurrence}
          options={options}
          canChangeType
          submitLabel="Criar conta fixa"
          initial={{
            type: "expense",
            description: "",
            amount_cents: 0,
            category_id: "",
            payment_method_id: "",
            day_of_month: Number(start.slice(8, 10)),
            starts_on: start,
            ends_on: "",
          }}
        />
      </div>
    </div>
  );
}

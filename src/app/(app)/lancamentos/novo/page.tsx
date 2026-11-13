import type { Metadata } from "next";

import { BackLink } from "@/components/layout/back-link";
import { PageHeader } from "@/components/layout/page-header";
import { createTransaction } from "@/features/transactions/actions";
import { TransactionForm } from "@/features/transactions/components/transaction-form";
import { getOptions } from "@/features/transactions/queries";
import { typeFromParam } from "@/features/transactions/status";
import { requireUser } from "@/lib/auth/session";
import { isValidISODate, today } from "@/lib/dates";

export const metadata: Metadata = { title: "Novo lançamento" };

export default async function NovoLancamentoPage({
  searchParams,
}: PageProps<"/lancamentos/novo">) {
  const user = await requireUser();
  const params = await searchParams;
  const options = await getOptions(user.id);
  const type = typeFromParam(params.tipo) ?? "expense";
  const date =
    typeof params.data === "string" && isValidISODate(params.data)
      ? params.data
      : today();

  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <BackLink href="/lancamentos">Lançamentos</BackLink>
      <PageHeader title="Novo lançamento" />
      <div className="rounded-card border bg-card p-5 sm:p-6">
        <TransactionForm
          action={createTransaction}
          options={options}
          submitLabel="Salvar lançamento"
          allowRepeat
          initial={{
            type,
            amount_cents: 0,
            interest_cents: 0,
            paid_cents: 0,
            description: "",
            category_id: "",
            payment_method_id: "",
            client_id: typeof params.cliente === "string" ? params.cliente : "",
            due_date: date,
            status: "paid",
            notes: "",
          }}
        />
      </div>
    </div>
  );
}

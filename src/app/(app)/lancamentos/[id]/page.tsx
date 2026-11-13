import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/form/delete-button";
import { BackLink } from "@/components/layout/back-link";
import { PageHeader } from "@/components/layout/page-header";
import {
  deleteTransaction,
  updateTransaction,
} from "@/features/transactions/actions";
import { TransactionForm } from "@/features/transactions/components/transaction-form";
import { getOptions, getTransaction } from "@/features/transactions/queries";
import { idSchema } from "@/features/transactions/schemas";
import { requireUser } from "@/lib/auth/session";
import { monthOf } from "@/lib/dates";

export const metadata: Metadata = { title: "Editar lançamento" };

export default async function EditarLancamentoPage({
  params,
}: PageProps<"/lancamentos/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();

  const [transaction, options] = await Promise.all([
    getTransaction(user.id, id),
    getOptions(user.id),
  ]);
  if (!transaction) notFound();

  const installment =
    transaction.installment_total && transaction.installment_total > 1
      ? ` · parcela ${transaction.installment_number} de ${transaction.installment_total}`
      : "";

  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <BackLink href={`/lancamentos?mes=${monthOf(transaction.due_date)}`}>
        Lançamentos
      </BackLink>
      <PageHeader
        title="Editar lançamento"
        description={installment ? installment.slice(3) : undefined}
      />
      <div className="rounded-card border bg-card p-5 sm:p-6">
        <TransactionForm
          action={updateTransaction.bind(null, transaction.id)}
          options={options}
          submitLabel="Salvar alterações"
          initial={{
            type: transaction.type,
            amount_cents: transaction.amount_cents,
            interest_cents: transaction.interest_cents,
            paid_cents:
              transaction.status === "partial" ? transaction.paid_cents : 0,
            description: transaction.description,
            category_id: transaction.category_id,
            payment_method_id: transaction.payment_method_id ?? "",
            due_date: transaction.due_date,
            status: transaction.status,
            notes: transaction.notes ?? "",
          }}
        />
      </div>
      <DeleteButton
        label="Excluir lançamento"
        onDelete={deleteTransaction.bind(null, transaction.id)}
      />
    </div>
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { monthOf, today } from "@/lib/dates";
import { PG, toFieldErrors, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

import { idSchema, transactionSchema } from "./schemas";

function backToList(dueDate: string): never {
  redirect(`/lancamentos?mes=${monthOf(dueDate)}`);
}

function friendlyDbError(code: string | undefined): FormState {
  if (code === PG.foreignKeyViolation) {
    return {
      error:
        "A categoria ou a forma de pagamento não vale para esse lançamento.",
    };
  }
  return { error: "Não deu para salvar. Confira os campos e tente de novo." };
}

function refresh() {
  revalidatePath("/", "layout");
}

export async function createTransaction(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = transactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { fieldErrors: toFieldErrors(parsed.error.issues) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .insert({ ...parsed.data, user_id: user.id });
  if (error) return friendlyDbError(error.code);

  refresh();
  backToList(parsed.data.due_date);
}

export async function updateTransaction(
  id: string,
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsedId = idSchema.safeParse(id);
  const parsed = transactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsedId.success) return { error: "Lançamento inválido." };
  if (!parsed.success)
    return { fieldErrors: toFieldErrors(parsed.error.issues) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    // paid_at fica com o banco: mantém a data se já estava pago, preenche hoje se acabou de pagar.
    .update(parsed.data)
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error) return friendlyDbError(error.code);
  if (!data) return { error: "Lançamento não encontrado." };

  refresh();
  backToList(parsed.data.due_date);
}

export async function deleteTransaction(id: string): Promise<FormState> {
  const user = await requireUser();
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { error: "Lançamento inválido." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select("due_date")
    .maybeSingle();
  if (error || !data) return { error: "Não deu para excluir. Tente de novo." };

  refresh();
  backToList(data.due_date);
}

/** Ação rápida da lista: quita o lançamento (o banco preenche valor e data). */
export async function markAsPaid(id: string): Promise<FormState> {
  const user = await requireUser();
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { error: "Lançamento inválido." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .update({ status: "paid", paid_at: today() })
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error || !data)
    return { error: "Não deu para atualizar. Tente de novo." };

  refresh();
  return {};
}

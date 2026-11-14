"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { PG, toFieldErrors, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

import { idSchema, paymentMethodSchema } from "./schemas";

const LIST = "/formas-de-pagamento";
const DUPLICATE = {
  fieldErrors: { name: "Você já tem uma forma de pagamento com esse nome." },
};

export async function createPaymentMethod(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = paymentMethodSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { fieldErrors: toFieldErrors(parsed.error.issues) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("payment_methods")
    .insert({ ...parsed.data, user_id: user.id });

  if (error?.code === PG.uniqueViolation) return DUPLICATE;
  if (error) return { error: "Não deu para salvar. Tente de novo." };

  revalidatePath(LIST);
  redirect(LIST);
}

export async function updatePaymentMethod(
  id: string,
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsedId = idSchema.safeParse(id);
  const parsed = paymentMethodSchema.safeParse(Object.fromEntries(formData));
  if (!parsedId.success) return { error: "Forma de pagamento inválida." };
  if (!parsed.success)
    return { fieldErrors: toFieldErrors(parsed.error.issues) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_methods")
    .update(parsed.data)
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error?.code === PG.uniqueViolation) return DUPLICATE;
  if (error || !data) return { error: "Não deu para salvar. Tente de novo." };

  revalidatePath(LIST);
  redirect(LIST);
}

export async function setPaymentMethodArchived(
  id: string,
  archived: boolean,
): Promise<FormState> {
  const user = await requireUser();
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { error: "Forma de pagamento inválida." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_methods")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data)
    return { error: "Não deu para atualizar. Tente de novo." };

  revalidatePath(LIST);
  redirect(LIST);
}

export async function deletePaymentMethod(id: string): Promise<FormState> {
  const user = await requireUser();
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { error: "Forma de pagamento inválida." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_methods")
    .delete()
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error?.code === PG.foreignKeyViolation) {
    return {
      error:
        "Essa forma de pagamento já foi usada em lançamentos. Arquive em vez de excluir.",
    };
  }
  if (error || !data) return { error: "Não deu para excluir. Tente de novo." };

  revalidatePath(LIST);
  redirect(LIST);
}

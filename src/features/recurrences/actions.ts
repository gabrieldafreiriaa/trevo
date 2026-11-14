"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { today } from "@/lib/dates";
import { PG, toFieldErrors, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

import { idSchema, recurrenceSchema } from "./schemas";

const LIST = "/recorrentes";

type Supabase = Awaited<ReturnType<typeof createClient>>;

function refresh() {
  revalidatePath("/", "layout");
}

function dbError(code?: string): FormState {
  if (code === PG.foreignKeyViolation) {
    return {
      error: "A categoria ou a forma de pagamento não vale para essa conta.",
    };
  }
  return { error: "Não deu para salvar. Tente de novo." };
}

/**
 * Apaga os lançamentos FUTUROS e ainda PENDENTES da regra (de hoje em diante).
 * Pagos, parciais e passados nunca são tocados.
 */
async function clearFuturePending(
  supabase: Supabase,
  userId: string,
  recurrenceId: string,
) {
  return supabase
    .from("transactions")
    .delete()
    .eq("user_id", userId)
    .eq("recurrence_id", recurrenceId)
    .eq("status", "pending")
    .gte("due_date", today());
}

async function generate(supabase: Supabase, recurrenceId: string) {
  return supabase.rpc("generate_recurring_transactions", {
    p_recurrence: recurrenceId,
  });
}

export async function createRecurrence(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = recurrenceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { fieldErrors: toFieldErrors(parsed.error.issues) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurrences")
    .insert({ ...parsed.data, user_id: user.id })
    .select("id")
    .single();
  if (error || !data) return dbError(error?.code);

  await generate(supabase, data.id);
  refresh();
  redirect(LIST);
}

export async function updateRecurrence(
  id: string,
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsedId = idSchema.safeParse(id);
  const parsed = recurrenceSchema.safeParse(Object.fromEntries(formData));
  if (!parsedId.success) return { error: "Conta fixa inválida." };
  if (!parsed.success)
    return { fieldErrors: toFieldErrors(parsed.error.issues) };

  // O tipo (entrada/saída) não muda depois de criado.
  const { type: _type, ...fields } = parsed.data;
  void _type;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurrences")
    .update(fields)
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select("id, active")
    .maybeSingle();
  if (error) return dbError(error.code);
  if (!data) return { error: "Conta fixa não encontrada." };

  // Regera os próximos meses com os dados novos.
  await clearFuturePending(supabase, user.id, data.id);
  if (data.active) await generate(supabase, data.id);

  refresh();
  redirect(LIST);
}

export async function setRecurrenceActive(
  id: string,
  active: boolean,
): Promise<FormState> {
  const user = await requireUser();
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { error: "Conta fixa inválida." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurrences")
    .update({ active })
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error || !data)
    return { error: "Não deu para atualizar. Tente de novo." };

  if (active) await generate(supabase, data.id);
  else await clearFuturePending(supabase, user.id, data.id);

  refresh();
  redirect(LIST);
}

export async function deleteRecurrence(id: string): Promise<FormState> {
  const user = await requireUser();
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { error: "Conta fixa inválida." };

  const supabase = await createClient();
  await clearFuturePending(supabase, user.id, parsedId.data);
  const { data, error } = await supabase
    .from("recurrences")
    .delete()
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error || !data) return { error: "Não deu para excluir. Tente de novo." };

  refresh();
  redirect(LIST);
}

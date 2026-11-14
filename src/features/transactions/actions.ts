"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { monthOf, today } from "@/lib/dates";
import { PG, toFieldErrors, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

import { buildInstallments } from "./installments";
import {
  idSchema,
  repeatSchema,
  toInterval,
  transactionSchema,
} from "./schemas";

function backToList(dueDate: string): never {
  redirect(`/lancamentos?mes=${monthOf(dueDate)}`);
}

function friendlyDbError(code?: string): FormState {
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
  const fields = Object.fromEntries(formData);
  const parsed = transactionSchema.safeParse(fields);
  const repeat = repeatSchema.safeParse({ repeat: "none", ...fields });
  if (!parsed.success || !repeat.success) {
    return {
      fieldErrors: {
        ...(repeat.success ? {} : toFieldErrors(repeat.error.issues)),
        ...(parsed.success ? {} : toFieldErrors(parsed.error.issues)),
      },
    };
  }

  const data = parsed.data;
  const supabase = await createClient();

  // Parcelado: todas as parcelas num único INSERT (atômico).
  if (repeat.data.repeat === "installments") {
    const interval = toInterval(repeat.data);
    if (!interval)
      return { fieldErrors: { interval_days: "Informe a cada quantos dias." } };

    const plan = buildInstallments({
      amountCents: data.amount_cents,
      mode: repeat.data.amount_mode,
      count: repeat.data.installment_count,
      firstDate: data.due_date,
      interval,
    });
    const groupId = crypto.randomUUID();
    const rows = plan.map((p) => ({
      ...data,
      user_id: user.id,
      amount_cents: p.amount_cents,
      due_date: p.due_date,
      installment_group_id: groupId,
      installment_number: p.number,
      installment_total: plan.length,
      // A situação escolhida vale para a 1ª parcela; as demais ficam pendentes.
      ...(p.number === 1
        ? {}
        : { status: "pending" as const, paid_cents: 0, interest_cents: 0 }),
    }));

    const { error } = await supabase.from("transactions").insert(rows);
    if (error) return friendlyDbError(error.code);
    refresh();
    backToList(data.due_date);
  }

  // Todo mês: cria a regra, gera os lançamentos e aplica a situação no primeiro.
  if (repeat.data.repeat === "monthly") {
    const { data: rule, error } = await supabase
      .from("recurrences")
      .insert({
        user_id: user.id,
        type: data.type,
        description: data.description,
        amount_cents: data.amount_cents,
        category_id: data.category_id,
        payment_method_id: data.payment_method_id,
        day_of_month: Number(data.due_date.slice(8, 10)),
        starts_on: data.due_date,
      })
      .select("id")
      .single();
    if (error || !rule) return friendlyDbError(error?.code);

    const gen = await supabase.rpc("generate_recurring_transactions", {
      p_recurrence: rule.id,
    });
    if (gen.error)
      return {
        error:
          "A conta fixa foi criada, mas não deu para gerar os lançamentos.",
      };

    if (data.status !== "pending" || data.interest_cents || data.notes) {
      await supabase
        .from("transactions")
        .update({
          status: data.status,
          paid_cents: data.paid_cents,
          interest_cents: data.interest_cents,
          notes: data.notes,
        })
        .eq("recurrence_id", rule.id)
        .eq("due_date", data.due_date)
        .eq("user_id", user.id);
    }

    refresh();
    revalidatePath("/recorrentes");
    backToList(data.due_date);
  }

  const { error } = await supabase
    .from("transactions")
    .insert({ ...data, user_id: user.id });
  if (error) return friendlyDbError(error.code);

  refresh();
  backToList(data.due_date);
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
  // Parcela de venda: volta para o carnê do cliente.
  if (parsed.data.client_id) redirect(`/clientes/${parsed.data.client_id}`);
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

/** Parcelas: exclui esta e as seguintes do mesmo parcelamento. */
export async function deleteInstallmentsFrom(id: string): Promise<FormState> {
  const user = await requireUser();
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { error: "Lançamento inválido." };

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("transactions")
    .select("installment_group_id, installment_number, due_date")
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!current?.installment_group_id || !current.installment_number) {
    return { error: "Esse lançamento não é parcelado." };
  }

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("user_id", user.id)
    .eq("installment_group_id", current.installment_group_id)
    .gte("installment_number", current.installment_number);
  if (error) return { error: "Não deu para excluir. Tente de novo." };

  // As parcelas que sobram passam a ser "x de N-1…" (ex.: 2 de 3, em vez de 2 de 10).
  if (current.installment_number > 1) {
    await supabase
      .from("transactions")
      .update({ installment_total: current.installment_number - 1 })
      .eq("user_id", user.id)
      .eq("installment_group_id", current.installment_group_id);
  }

  refresh();
  backToList(current.due_date);
}

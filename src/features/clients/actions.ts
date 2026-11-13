"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { PG, toFieldErrors, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

import { buildSalePlan } from "./sale";
import { clientSchema, idSchema, saleSchema } from "./schemas";

function refresh() {
  revalidatePath("/", "layout");
}

export async function createClientAction(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { fieldErrors: toFieldErrors(parsed.error.issues) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({ ...parsed.data, user_id: user.id })
    .select("id")
    .single();
  if (error || !data) return { error: "Não deu para salvar. Tente de novo." };

  refresh();
  redirect(`/clientes/${data.id}`);
}

export async function updateClientAction(
  id: string,
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsedId = idSchema.safeParse(id);
  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsedId.success) return { error: "Cliente inválido." };
  if (!parsed.success)
    return { fieldErrors: toFieldErrors(parsed.error.issues) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .update(parsed.data)
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error || !data) return { error: "Não deu para salvar. Tente de novo." };

  refresh();
  redirect(`/clientes/${data.id}`);
}

export async function setClientArchived(
  id: string,
  archived: boolean,
): Promise<FormState> {
  const user = await requireUser();
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { error: "Cliente inválido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", parsedId.data)
    .eq("user_id", user.id);
  if (error) return { error: "Não deu para atualizar. Tente de novo." };

  refresh();
  redirect("/clientes");
}

export async function deleteClientAction(id: string): Promise<FormState> {
  const user = await requireUser();
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { error: "Cliente inválido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", parsedId.data)
    .eq("user_id", user.id);
  if (error?.code === PG.foreignKeyViolation) {
    return {
      error:
        "Esse cliente já tem vendas registradas. Arquive em vez de excluir.",
    };
  }
  if (error) return { error: "Não deu para excluir. Tente de novo." };

  refresh();
  redirect("/clientes");
}

/**
 * Venda parcelada (ou a prazo, em 1x): cria as parcelas como entradas pendentes do cliente
 * e, se houver, a entrada (sinal) no mesmo grupo, como parcela 0.
 */
export async function createSale(
  clientId: string,
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsedId = idSchema.safeParse(clientId);
  const parsed = saleSchema.safeParse(Object.fromEntries(formData));
  if (!parsedId.success) return { error: "Cliente inválido." };
  if (!parsed.success)
    return { fieldErrors: toFieldErrors(parsed.error.issues) };

  const v = parsed.data;
  const interval =
    v.interval_kind === "monthly"
      ? ({ kind: "monthly" } as const)
      : v.interval_kind === "biweekly"
        ? ({ kind: "biweekly" } as const)
        : ({ kind: "days", every: v.interval_days ?? 30 } as const);

  const downCents = v.has_down_payment ? v.down_amount_cents : 0;
  const sale = buildSalePlan({
    amountCents: v.amount_cents,
    mode: v.amount_mode,
    count: v.installment_count,
    firstDate: v.first_date,
    interval,
    downPaymentCents: downCents,
  });
  if (!sale) {
    return {
      fieldErrors: {
        down_amount_cents: "A entrada precisa ser menor que o total da venda.",
      },
    };
  }
  const plan = sale.installments;
  const groupId = crypto.randomUUID();

  const downPayment =
    v.has_down_payment && v.down_date
      ? [
          {
            user_id: user.id,
            type: "income" as const,
            description: v.description,
            amount_cents: v.down_amount_cents,
            status: v.down_status,
            due_date: v.down_date,
            category_id: v.category_id,
            payment_method_id: v.down_payment_method_id,
            client_id: parsedId.data,
            installment_group_id: groupId,
            // 0 = entrada da venda (ver migration 20261113000600)
            installment_number: 0,
            installment_total: plan.length,
          },
        ]
      : [];

  const supabase = await createClient();
  const { error } = await supabase.from("transactions").insert([
    ...downPayment,
    ...plan.map((p) => ({
      user_id: user.id,
      type: "income" as const,
      description: v.description,
      amount_cents: p.amount_cents,
      status: "pending" as const,
      due_date: p.due_date,
      category_id: v.category_id,
      payment_method_id: v.payment_method_id,
      client_id: parsedId.data,
      installment_group_id: groupId,
      installment_number: p.number,
      installment_total: plan.length,
    })),
  ]);
  if (error?.code === PG.foreignKeyViolation) {
    return {
      error:
        "A categoria, a forma de recebimento ou o cliente não valem para essa venda.",
    };
  }
  if (error) return { error: "Não deu para salvar a venda. Tente de novo." };

  refresh();
  redirect(`/clientes/${parsedId.data}`);
}

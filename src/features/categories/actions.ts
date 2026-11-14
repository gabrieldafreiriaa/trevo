"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { PG, toFieldErrors, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

import { TYPE_PARAM, type CategoryType } from "./constants";
import {
  categoryFieldsSchema,
  createCategorySchema,
  idSchema,
} from "./schemas";

const DUPLICATE = {
  fieldErrors: { name: "Você já tem uma categoria com esse nome." },
};

function listPath(type: CategoryType) {
  return `/categorias?tipo=${TYPE_PARAM[type]}`;
}

export async function createCategory(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = createCategorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { fieldErrors: toFieldErrors(parsed.error.issues) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .insert({ ...parsed.data, user_id: user.id });

  if (error?.code === PG.uniqueViolation) return DUPLICATE;
  if (error) return { error: "Não deu para salvar. Tente de novo." };

  revalidatePath("/categorias");
  redirect(listPath(parsed.data.type));
}

export async function updateCategory(
  id: string,
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsedId = idSchema.safeParse(id);
  const parsed = categoryFieldsSchema.safeParse(Object.fromEntries(formData));
  if (!parsedId.success) return { error: "Categoria inválida." };
  if (!parsed.success)
    return { fieldErrors: toFieldErrors(parsed.error.issues) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .update(parsed.data)
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select("type")
    .maybeSingle();

  if (error?.code === PG.uniqueViolation) return DUPLICATE;
  if (error || !data) return { error: "Não deu para salvar. Tente de novo." };

  revalidatePath("/categorias");
  redirect(listPath(data.type));
}

export async function setCategoryArchived(
  id: string,
  archived: boolean,
): Promise<FormState> {
  const user = await requireUser();
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { error: "Categoria inválida." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select("type")
    .maybeSingle();

  if (error || !data)
    return { error: "Não deu para atualizar. Tente de novo." };

  revalidatePath("/categorias");
  redirect(listPath(data.type));
}

export async function deleteCategory(id: string): Promise<FormState> {
  const user = await requireUser();
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { error: "Categoria inválida." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .delete()
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select("type")
    .maybeSingle();

  if (error?.code === PG.foreignKeyViolation) {
    return {
      error:
        "Essa categoria já tem lançamentos. Arquive em vez de excluir: o histórico fica guardado.",
    };
  }
  if (error || !data) return { error: "Não deu para excluir. Tente de novo." };

  revalidatePath("/categorias");
  redirect(listPath(data.type));
}

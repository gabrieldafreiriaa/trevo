import "server-only";

import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

import type { CategoryType } from "./constants";

export type Category = Tables<"categories">;

/**
 * Categorias do PRÓPRIO usuário. O filtro por user_id é obrigatório:
 * para o admin, o RLS libera a leitura de todos.
 */
export async function listCategories(userId: string, type: CategoryType) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .eq("type", type)
    .order("name");
  if (error) throw error;

  return {
    active: data.filter((c) => !c.archived_at),
    archived: data.filter((c) => c.archived_at),
  };
}

export async function getCategory(userId: string, id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

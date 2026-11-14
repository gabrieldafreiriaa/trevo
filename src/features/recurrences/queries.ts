import "server-only";

import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type Recurrence = Tables<"recurrences">;

/** Contas fixas do PRÓPRIO usuário. */
export async function listRecurrences(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurrences")
    .select("*")
    .eq("user_id", userId)
    .order("active", { ascending: false })
    .order("day_of_month")
    .order("description");
  if (error) throw error;
  return data;
}

export async function getRecurrence(userId: string, id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurrences")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

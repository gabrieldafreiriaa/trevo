import "server-only";

import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type PaymentMethod = Tables<"payment_methods">;

/** Formas de pagamento do PRÓPRIO usuário (o admin enxerga todas pelo RLS). */
export async function listPaymentMethods(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("user_id", userId)
    .order("name");
  if (error) throw error;

  return {
    active: data.filter((p) => !p.archived_at),
    archived: data.filter((p) => p.archived_at),
  };
}

export async function getPaymentMethod(userId: string, id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Enums } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type FamilyMember = {
  id: string;
  fullName: string;
  role: Enums<"user_role">;
  email: string | null;
  /** Aceitou o convite (definiu senha / já entrou). */
  active: boolean;
  lastSignInAt: string | null;
};

/** Perfis visíveis para o admin (via RLS). Usado no seletor "Visualizando o painel de". */
export async function listProfiles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .order("full_name");
  if (error) throw error;
  return data;
}

/**
 * Usuários com e-mail e situação do convite. Precisa da service role
 * (o e-mail mora em auth.users). Retorna `null` se a chave não estiver configurada.
 */
export async function listFamily(): Promise<FamilyMember[] | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const [profiles, users] = await Promise.all([
    listProfiles(),
    admin.auth.admin.listUsers({ page: 1, perPage: 100 }),
  ]);
  if (users.error) throw users.error;

  const byId = new Map(users.data.users.map((u) => [u.id, u]));
  return profiles.map((p) => {
    const u = byId.get(p.id);
    return {
      id: p.id,
      fullName: p.full_name,
      role: p.role,
      email: u?.email ?? null,
      active: Boolean(u?.last_sign_in_at),
      lastSignInAt: u?.last_sign_in_at ?? null,
    };
  });
}

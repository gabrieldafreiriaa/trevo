import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
import { SUPABASE_URL } from "./env";

/**
 * Cliente com a SERVICE ROLE: passa por cima do RLS.
 * Uso restrito (CLAUDE.md, regra 2): só para convidar e listar usuários,
 * e sempre depois de `requireAdmin()`. Nunca importe em componente de cliente.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient<Database>(SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

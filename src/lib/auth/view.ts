import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

import { requireUser, type CurrentUser } from "./session";

export const VIEW_COOKIE = "trevo_view_as";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ViewContext = {
  user: CurrentUser;
  /** De quem são os dados mostrados na tela. */
  ownerId: string;
  ownerName: string;
  /** true quando o admin está vendo o painel de outra pessoa. */
  readOnly: boolean;
};

/**
 * Contexto de visualização: o admin pode ver o painel de outra pessoa
 * (cookie trevo_view_as). Quem não é admin sempre vê só o próprio.
 * A garantia de "só leitura" é do RLS; aqui só escolhemos o que mostrar.
 */
export const getViewContext = cache(async (): Promise<ViewContext> => {
  const user = await requireUser();
  const self = {
    user,
    ownerId: user.id,
    ownerName: user.fullName,
    readOnly: false,
  };
  if (!user.isAdmin) return self;

  const target = (await cookies()).get(VIEW_COOKIE)?.value;
  if (!target || target === user.id || !UUID.test(target)) return self;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", target)
    .maybeSingle();
  if (!data) return self;

  return { user, ownerId: data.id, ownerName: data.full_name, readOnly: true };
});

/** Telas de criar/editar: fora do modo leitura. Se estiver vendo outra pessoa, volta ao início. */
export async function requireWritable(): Promise<ViewContext> {
  const ctx = await getViewContext();
  if (ctx.readOnly) redirect("/");
  return ctx;
}

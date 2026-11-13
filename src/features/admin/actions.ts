"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/session";
import { VIEW_COOKIE } from "@/lib/auth/view";
import { toFieldErrors, type FormState } from "@/lib/forms";
import { createAdminClient } from "@/lib/supabase/admin";

import { inviteSchema, userIdSchema } from "./schemas";

const NO_KEY: FormState = {
  error:
    "Falta configurar a SUPABASE_SERVICE_ROLE_KEY no servidor (.env.local ou Vercel) para enviar convites.",
};

/** Convida alguém por e-mail. O link do e-mail leva para /definir-senha. */
export async function inviteUser(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { fieldErrors: toFieldErrors(parsed.error.issues) };

  const admin = createAdminClient();
  if (!admin) return NO_KEY;

  const { error } = await admin.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      data: { full_name: parsed.data.full_name },
    },
  );
  if (error) {
    const already = /already|registered|exists/i.test(error.message);
    return {
      error: already
        ? "Esse e-mail já tem conta no Trevo."
        : "Não deu para enviar o convite. Confira o e-mail e tente de novo.",
    };
  }

  revalidatePath("/admin/usuarios");
  return { success: `Convite enviado para ${parsed.data.email}.` };
}

/** Reenvia o convite de quem ainda não entrou. */
export async function resendInvite(email: string): Promise<FormState> {
  await requireAdmin();
  const admin = createAdminClient();
  if (!admin) return NO_KEY;

  const { error } = await admin.auth.admin.inviteUserByEmail(email);
  if (error)
    return { error: "Não deu para reenviar. Tente de novo em alguns minutos." };
  return { success: `Convite reenviado para ${email}.` };
}

/** Admin escolhe de quem é o painel que está vendo (somente leitura). `null` volta ao próprio. */
export async function setViewAs(userId: string | null) {
  const admin = await requireAdmin();
  const store = await cookies();

  if (!userId || userId === admin.id) {
    store.delete(VIEW_COOKIE);
  } else if (userIdSchema.safeParse(userId).success) {
    store.set(VIEW_COOKIE, userId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
  }

  revalidatePath("/", "layout");
  redirect("/");
}

"use server";

import { redirect } from "next/navigation";

import { toFieldErrors as fieldErrors, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

import {
  forgotPasswordSchema,
  safeNextPath,
  setPasswordSchema,
  signInSchema,
} from "./schemas";

export async function signIn(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: "E-mail ou senha incorretos." };
  }

  redirect(safeNextPath(formData.get("next")));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error.issues) };
  }

  const supabase = await createClient();
  // O link do e-mail vem do template supabase/templates/recovery.html,
  // que aponta para /auth/confirm → /definir-senha.
  await supabase.auth.resetPasswordForEmail(parsed.data.email);

  // Mesma resposta exista ou não a conta, para não revelar quem tem cadastro.
  return {
    success:
      "Se esse e-mail tiver cadastro, você vai receber um link para criar uma nova senha.",
  };
}

export async function setPassword(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = setPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return {
      error:
        error.code === "same_password"
          ? "A nova senha precisa ser diferente da anterior."
          : "Não deu para salvar a senha. Abra o link do e-mail de novo e tente outra vez.",
    };
  }

  redirect("/");
}

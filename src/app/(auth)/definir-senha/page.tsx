import type { Metadata } from "next";
import Link from "next/link";

import { SetPasswordForm } from "@/features/auth/components/set-password-form";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Definir senha" };

export default async function SetPasswordPage() {
  const user = await requireUser();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-[-0.6px]">
          Olá, {user.fullName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Escolha uma senha para entrar com <strong>{user.email}</strong>.
        </p>
      </div>
      <SetPasswordForm />
      <Link
        href="/"
        className="flex h-11 items-center self-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Voltar ao Trevo
      </Link>
    </div>
  );
}

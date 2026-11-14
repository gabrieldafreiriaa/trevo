import type { Metadata } from "next";

import { SetPasswordForm } from "@/features/auth/components/set-password-form";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Criar senha" };

export default async function SetPasswordPage() {
  const user = await requireUser();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-[-0.6px]">
          Olá, {user.fullName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Crie uma senha para entrar com <strong>{user.email}</strong>.
        </p>
      </div>
      <SetPasswordForm />
    </div>
  );
}

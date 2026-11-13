import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = { title: "Esqueci minha senha" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-[-0.6px]">
          Esqueci minha senha
        </h1>
        <p className="text-sm text-muted-foreground">
          Mandamos um link para você criar uma senha nova.
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}

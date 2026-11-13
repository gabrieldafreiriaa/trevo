import type { Metadata } from "next";

import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Usuários" };

export default async function AdminUsuariosPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader
        title="Usuários"
        description="Só o administrador vê esta tela."
      />
      <ComingSoon sprint="S7">
        Convidar pessoas por e-mail e ver quem já tem acesso.
      </ComingSoon>
    </>
  );
}

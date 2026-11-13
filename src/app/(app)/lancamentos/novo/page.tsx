import type { Metadata } from "next";

import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Novo lançamento" };

export default function LancamentosNovoPage() {
  return (
    <>
      <PageHeader title="Novo lançamento" />
      <ComingSoon sprint="S3">
        O formulário de entrada e saída, com categoria, forma de pagamento e
        situação.
      </ComingSoon>
    </>
  );
}

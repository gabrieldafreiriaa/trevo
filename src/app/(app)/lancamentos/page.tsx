import type { Metadata } from "next";

import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Lançamentos" };

export default function LancamentosPage() {
  return (
    <>
      <PageHeader title="Lançamentos" />
      <ComingSoon sprint="S3">
        A lista do mês, com filtros por categoria, forma de pagamento e
        situação.
      </ComingSoon>
    </>
  );
}

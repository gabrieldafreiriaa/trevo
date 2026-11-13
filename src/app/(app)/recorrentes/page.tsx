import type { Metadata } from "next";

import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Recorrentes" };

export default function RecorrentesPage() {
  return (
    <>
      <PageHeader title="Recorrentes" />
      <ComingSoon sprint="S4">
        As contas fixas que se repetem todo mês, como aluguel e salário.
      </ComingSoon>
    </>
  );
}

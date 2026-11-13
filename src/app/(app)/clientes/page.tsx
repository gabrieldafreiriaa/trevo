import type { Metadata } from "next";

import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Clientes" };

export default function ClientesPage() {
  return (
    <>
      <PageHeader title="Clientes" />
      <ComingSoon sprint="S5">
        Seus clientes, as vendas parceladas e o carnê de cada um.
      </ComingSoon>
    </>
  );
}

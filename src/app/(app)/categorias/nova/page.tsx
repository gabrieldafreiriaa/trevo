import type { Metadata } from "next";

import { BackLink } from "@/components/layout/back-link";
import { PageHeader } from "@/components/layout/page-header";
import { createCategory } from "@/features/categories/actions";
import { CategoryForm } from "@/features/categories/components/category-form";
import {
  DEFAULT_COLOR,
  DEFAULT_ICON,
  TYPE_PARAM,
  typeFromParam,
} from "@/features/categories/constants";

export const metadata: Metadata = { title: "Nova categoria" };

export default async function NovaCategoriaPage({
  searchParams,
}: PageProps<"/categorias/nova">) {
  const type = typeFromParam((await searchParams).tipo);

  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <BackLink href={`/categorias?tipo=${TYPE_PARAM[type]}`}>
        Categorias
      </BackLink>
      <PageHeader title="Nova categoria" />
      <div className="rounded-card border bg-card p-5 sm:p-6">
        <CategoryForm
          action={createCategory}
          initial={{ name: "", color: DEFAULT_COLOR, icon: DEFAULT_ICON, type }}
          canChangeType
          submitLabel="Criar categoria"
        />
      </div>
    </div>
  );
}

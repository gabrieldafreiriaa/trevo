import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DangerActions } from "@/components/form/danger-actions";
import { BackLink } from "@/components/layout/back-link";
import { PageHeader } from "@/components/layout/page-header";
import {
  deleteCategory,
  setCategoryArchived,
  updateCategory,
} from "@/features/categories/actions";
import { CategoryForm } from "@/features/categories/components/category-form";
import { TYPE_PARAM } from "@/features/categories/constants";
import { getCategory } from "@/features/categories/queries";
import { idSchema } from "@/features/categories/schemas";
import { requireWritable } from "@/lib/auth/view";

export const metadata: Metadata = { title: "Editar categoria" };

export default async function EditarCategoriaPage({
  params,
}: PageProps<"/categorias/[id]">) {
  const { user } = await requireWritable();
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();

  const category = await getCategory(user.id, id);
  if (!category) notFound();

  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <BackLink href={`/categorias?tipo=${TYPE_PARAM[category.type]}`}>
        Categorias
      </BackLink>
      <PageHeader title="Editar categoria" />
      <div className="rounded-card border bg-card p-5 sm:p-6">
        <CategoryForm
          action={updateCategory.bind(null, category.id)}
          initial={category}
          canChangeType={false}
          submitLabel="Salvar alterações"
        />
      </div>
      <DangerActions
        noun="categoria"
        archived={Boolean(category.archived_at)}
        onArchive={setCategoryArchived.bind(null, category.id)}
        onDelete={deleteCategory.bind(null, category.id)}
      />
    </div>
  );
}

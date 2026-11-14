import { ChevronRight, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { RowLink } from "@/components/layout/row-link";
import { Button } from "@/components/ui/button";
import { SegmentedLinks } from "@/components/ui/segmented-links";
import { CategoryIcon } from "@/features/categories/components/category-badge";
import { TYPE_PARAM, typeFromParam } from "@/features/categories/constants";
import { listCategories, type Category } from "@/features/categories/queries";
import { getViewContext } from "@/lib/auth/view";

export const metadata: Metadata = { title: "Categorias" };

function CategoryRow({
  category,
  readOnly,
}: {
  category: Category;
  readOnly: boolean;
}) {
  return (
    <RowLink
      readOnly={readOnly}
      href={`/categorias/${category.id}`}
      className="flex h-16 items-center gap-3 border-b border-divider px-4 last:border-b-0 hover:bg-secondary"
    >
      <CategoryIcon icon={category.icon} color={category.color} />
      <span className="flex-1 truncate text-[15px] font-medium">
        {category.name}
      </span>
      {readOnly ? null : (
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
      )}
    </RowLink>
  );
}

export default async function CategoriasPage({
  searchParams,
}: PageProps<"/categorias">) {
  const ctx = await getViewContext();
  const type = typeFromParam((await searchParams).tipo);
  const { active, archived } = await listCategories(ctx.ownerId, type);

  return (
    <>
      <PageHeader
        title="Categorias"
        description="Usadas para organizar os lançamentos e o dashboard."
        actions={
          ctx.readOnly ? null : (
            <Button asChild>
              <Link href={`/categorias/nova?tipo=${TYPE_PARAM[type]}`}>
                <Plus strokeWidth={2.5} aria-hidden />
                Nova categoria
              </Link>
            </Button>
          )
        }
      />

      <SegmentedLinks
        label="Tipo de categoria"
        items={[
          {
            href: "/categorias?tipo=saidas",
            label: "Saídas",
            active: type === "expense",
          },
          {
            href: "/categorias?tipo=entradas",
            label: "Entradas",
            active: type === "income",
          },
        ]}
      />

      {active.length ? (
        <div className="overflow-hidden rounded-card border bg-card">
          {active.map((c) => (
            <CategoryRow key={c.id} category={c} readOnly={ctx.readOnly} />
          ))}
        </div>
      ) : (
        <p className="rounded-card border border-dashed border-input bg-card px-6 py-10 text-center text-sm text-muted-foreground">
          {ctx.readOnly
            ? "Nenhuma categoria ativa."
            : "Nenhuma categoria ativa. Crie a primeira no botão acima."}
        </p>
      )}

      {archived.length ? (
        <details className="group flex flex-col gap-3">
          <summary className="flex h-11 w-fit cursor-pointer items-center text-sm text-muted-foreground hover:text-foreground">
            Arquivadas ({archived.length})
          </summary>
          <div className="mt-3 overflow-hidden rounded-card border bg-card opacity-80">
            {archived.map((c) => (
              <CategoryRow key={c.id} category={c} readOnly={ctx.readOnly} />
            ))}
          </div>
        </details>
      ) : null}
    </>
  );
}

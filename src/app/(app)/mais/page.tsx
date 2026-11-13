import { ChevronRight, LogOut } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { adminNav, mainNav } from "@/components/layout/nav-items";
import { Avatar } from "@/components/layout/user-badge";
import { signOut } from "@/features/auth/actions";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Mais" };

/** Menu completo no celular (no computador, o menu lateral já mostra tudo). */
export default async function MaisPage() {
  const user = await requireUser();
  const items = [
    ...mainNav.filter(
      (i) => !["/", "/lancamentos", "/clientes"].includes(i.href),
    ),
    ...(user.isAdmin ? adminNav : []),
  ];

  return (
    <>
      <PageHeader title="Mais" />

      <div className="flex items-center gap-3 rounded-card border bg-card p-4">
        <Avatar name={user.fullName} className="size-11" />
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{user.fullName}</span>
          <span className="truncate text-sm text-muted-foreground">
            {user.email}
          </span>
        </div>
      </div>

      <nav
        aria-label="Outras seções"
        className="flex flex-col overflow-hidden rounded-card border bg-card"
      >
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex h-14 items-center gap-3 border-b border-divider px-4 last:border-b-0 hover:bg-secondary"
          >
            <Icon className="size-5 text-muted-foreground" aria-hidden />
            <span className="flex-1 text-[15px]">{label}</span>
            <ChevronRight
              className="size-4 text-muted-foreground"
              aria-hidden
            />
          </Link>
        ))}
      </nav>

      <form action={signOut}>
        <button
          type="submit"
          className="flex h-14 w-full cursor-pointer items-center gap-3 rounded-card border bg-card px-4 text-[15px] text-expense hover:bg-secondary"
        >
          <LogOut className="size-5" aria-hidden />
          Sair
        </button>
      </form>
    </>
  );
}

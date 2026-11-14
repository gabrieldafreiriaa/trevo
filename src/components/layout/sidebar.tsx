"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { ViewAsSelect } from "@/features/admin/components/view-as-select";
import { signOut } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

import { adminNav, isActive, mainNav, type NavItem } from "./nav-items";
import { Avatar } from "./user-badge";

type SidebarProps = {
  fullName: string;
  isAdmin: boolean;
  selfId: string;
  ownerId: string;
  people: { id: string; full_name: string }[];
};

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-11 items-center gap-3 rounded-[10px] px-3 text-sm transition-colors",
        active
          ? "bg-graphite font-medium text-graphite-foreground"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      <Icon
        className={cn("size-[18px]", active && "text-primary")}
        aria-hidden
      />
      {item.label}
    </Link>
  );
}

/** Menu lateral (só no computador, a partir de 1024px). */
export function Sidebar({
  fullName,
  isAdmin,
  selfId,
  ownerId,
  people,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col gap-7 border-r bg-card px-[18px] py-7 lg:flex">
      <Link href="/" className="px-2" aria-label="Trevo, ir para o início">
        <Logo />
      </Link>

      <nav aria-label="Menu principal" className="flex flex-col gap-1">
        {mainNav.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      {isAdmin ? (
        <nav aria-label="Administração" className="flex flex-col gap-1">
          <span className="px-3 pb-1.5 text-[11px] font-semibold tracking-[0.8px] text-muted-foreground uppercase">
            Admin
          </span>
          {adminNav.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
      ) : null}

      {isAdmin && people.length > 1 ? (
        <div className="mt-auto">
          <ViewAsSelect selfId={selfId} ownerId={ownerId} people={people} />
        </div>
      ) : null}

      <div
        className={cn(
          "flex items-center gap-2.5 border-t border-divider px-1 pt-4",
          !(isAdmin && people.length > 1) && "mt-auto",
        )}
      >
        <Avatar name={fullName} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">{fullName}</span>
          <span className="text-xs text-muted-foreground">
            {isAdmin ? "Administrador" : "Usuário"}
          </span>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            aria-label="Sair"
            title="Sair"
            className="flex size-11 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="size-[18px]" aria-hidden />
          </button>
        </form>
      </div>
    </aside>
  );
}

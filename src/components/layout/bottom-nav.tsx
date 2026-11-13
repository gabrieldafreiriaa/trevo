"use client";

import { Ellipsis, House, List, Plus, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { isActive } from "./nav-items";

const left = [
  { href: "/", label: "Início", icon: House },
  { href: "/lancamentos", label: "Extrato", icon: List },
];
const right = [
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/mais", label: "Mais", icon: Ellipsis },
];

function Tab({
  item,
  pathname,
}: {
  item: (typeof left)[number];
  pathname: string;
}) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-[52px] w-16 flex-col items-center justify-center gap-1 text-[11px]",
        active ? "font-semibold text-foreground" : "text-muted-foreground",
      )}
    >
      <Icon className="size-[22px]" aria-hidden />
      {item.label}
    </Link>
  );
}

/** Barra inferior (só no celular e tablet, abaixo de 1024px). */
export function BottomNav({ readOnly = false }: { readOnly?: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Menu principal"
      className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t bg-card px-2 pb-[max(10px,env(safe-area-inset-bottom))] lg:hidden"
    >
      {left.map((item) => (
        <Tab key={item.href} item={item} pathname={pathname} />
      ))}
      {readOnly ? (
        <span className="w-[60px]" aria-hidden />
      ) : (
        <Link
          href="/lancamentos/novo"
          aria-label="Novo lançamento"
          className="-mt-7 flex size-[60px] items-center justify-center rounded-[20px] border-4 border-background bg-primary text-primary-foreground"
        >
          <Plus className="size-[26px]" strokeWidth={2.6} aria-hidden />
        </Link>
      )}
      {right.map((item) => (
        <Tab key={item.href} item={item} pathname={pathname} />
      ))}
    </nav>
  );
}

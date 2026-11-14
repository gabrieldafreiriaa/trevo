import Link from "next/link";

import { cn } from "@/lib/utils";

type Item = { href: string; label: string; active: boolean };

/** Abas em forma de "pílula" que navegam por URL (ex.: Saídas | Entradas). */
export function SegmentedLinks({
  items,
  label,
}: {
  items: Item[];
  label: string;
}) {
  return (
    <nav
      aria-label={label}
      className="grid w-full max-w-xs grid-cols-2 gap-1 rounded-xl bg-secondary p-1"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={cn(
            "flex h-10 items-center justify-center rounded-[10px] text-sm font-semibold transition-colors",
            item.active
              ? "bg-card text-foreground shadow-[0_0_0_1px_var(--border)]"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

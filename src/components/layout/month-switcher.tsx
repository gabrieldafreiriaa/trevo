"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { formatMonthBR, shiftMonth, type MonthKey } from "@/lib/dates";

/** Setas de mês. O mês fica na URL (?mes=2026-11), então dá pra compartilhar e voltar. */
export function MonthSwitcher({ month }: { month: MonthKey }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hrefFor = (m: MonthKey) => {
    const params = new URLSearchParams(searchParams);
    params.set("mes", m);
    return `${pathname}?${params.toString()}`;
  };

  const label = formatMonthBR(month);
  const title = label.charAt(0).toUpperCase() + label.slice(1);

  const arrow =
    "flex size-11 items-center justify-center rounded-lg border border-input bg-card hover:bg-secondary lg:size-9";

  return (
    <div className="flex items-center gap-2">
      <Link
        href={hrefFor(shiftMonth(month, -1))}
        aria-label="Mês anterior"
        className={arrow}
      >
        <ChevronLeft className="size-4" aria-hidden />
      </Link>
      <h1 className="min-w-0 font-display text-2xl font-semibold tracking-[-0.6px] lg:text-[30px] lg:tracking-[-0.8px]">
        {title}
      </h1>
      <Link
        href={hrefFor(shiftMonth(month, 1))}
        aria-label="Próximo mês"
        className={arrow}
      >
        <ChevronRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}

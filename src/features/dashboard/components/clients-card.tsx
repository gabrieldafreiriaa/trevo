import { ChevronRight, Users } from "lucide-react";
import Link from "next/link";

import { formatBRL } from "@/lib/money";

/** "A receber de clientes": total em aberto das vendas e quanto está atrasado. */
export function ClientsCard({
  toReceive,
  overdue,
}: {
  toReceive: number;
  overdue: number;
}) {
  return (
    <Link
      href="/clientes"
      className="flex items-center gap-4 rounded-card border bg-card p-5 transition-colors hover:bg-secondary"
    >
      <span
        aria-hidden
        className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary"
      >
        <Users className="size-5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm text-muted-foreground">
          A receber de clientes
        </span>
        <span className="font-display text-xl font-semibold tracking-[-0.5px] text-income tabular-nums">
          {formatBRL(toReceive)}
        </span>
        {overdue > 0 ? (
          <span className="text-[13px] font-medium text-status-overdue-foreground">
            {formatBRL(overdue)} em atraso
          </span>
        ) : (
          <span className="text-[13px] text-muted-foreground">
            Nenhuma parcela atrasada
          </span>
        )}
      </div>
      <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
    </Link>
  );
}

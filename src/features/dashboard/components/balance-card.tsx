import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

type Props = {
  balance: number;
  predicted: number;
  toPay: number;
  toReceive: number;
  change: number | null;
};

/** Card grafite do saldo: o número que a pessoa olha primeiro. */
export function BalanceCard({
  balance,
  predicted,
  toPay,
  toReceive,
  change,
}: Props) {
  return (
    <section
      aria-label="Saldo do mês"
      className="flex flex-col justify-between gap-5 rounded-card bg-graphite p-6 text-graphite-foreground sm:col-span-2"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-graphite-muted">Saldo do mês</span>
        {change !== null ? (
          <span
            className={cn(
              "rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium",
              change >= 0 ? "text-graphite-income" : "text-graphite-expense",
            )}
          >
            {change >= 0 ? "+" : "−"}
            {Math.abs(change)}% vs mês anterior
          </span>
        ) : null}
      </div>
      <span className="font-display text-[40px] leading-none font-semibold tracking-[-1.5px] tabular-nums lg:text-[46px]">
        {formatBRL(balance)}
      </span>
      <dl className="flex flex-wrap gap-x-7 gap-y-3 text-[13px]">
        <div className="flex flex-col gap-0.5">
          <dt className="text-graphite-muted">Previsto até o fim do mês</dt>
          <dd className="text-base font-medium tabular-nums">
            {formatBRL(predicted)}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-graphite-muted">Ainda a pagar</dt>
          <dd className="text-base font-medium text-graphite-expense tabular-nums">
            {formatBRL(toPay)}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-graphite-muted">Ainda a receber</dt>
          <dd className="text-base font-medium text-graphite-income tabular-nums">
            {formatBRL(toReceive)}
          </dd>
        </div>
      </dl>
    </section>
  );
}

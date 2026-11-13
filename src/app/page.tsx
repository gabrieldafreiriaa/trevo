import { Logo } from "@/components/brand/logo";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Página provisória do S0: confirma que tokens, fontes e utilitários
 * estão funcionando. Será substituída pelo dashboard no S5.
 */

const statuses = [
  { label: "Pago", className: "bg-status-paid text-status-paid-foreground" },
  {
    label: "Pendente",
    className: "bg-status-pending text-status-pending-foreground",
  },
  {
    label: "Parcial",
    className: "bg-status-partial text-status-partial-foreground",
  },
  {
    label: "Atrasado",
    className: "bg-status-overdue text-status-overdue-foreground",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-5 py-12">
      <Logo />

      <section className="flex flex-col gap-5 rounded-card bg-graphite p-6 text-graphite-foreground">
        <span className="text-sm text-graphite-muted">
          Saldo do mês (exemplo)
        </span>
        <span className="font-display text-[40px] leading-none font-semibold tracking-[-1.5px]">
          {formatBRL(208000)}
        </span>
        <div className="flex gap-6 text-sm">
          <span className="text-graphite-income">
            {formatBRL(620000, { signed: true })}
          </span>
          <span className="text-graphite-expense">
            {formatBRL(-412000, { signed: true })}
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-card border bg-card p-6">
        <h1 className="text-[17px] font-semibold">Fundação pronta</h1>
        <p className="text-sm text-muted-foreground">
          Tokens, fontes e utilitários configurados. Próximo passo: login e
          layout (Sprint 1).
        </p>
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <span
              key={s.label}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold",
                s.className,
              )}
            >
              {s.label}
            </span>
          ))}
        </div>
        <button
          type="button"
          className="h-11 rounded-lg bg-primary px-5 text-[15px] font-semibold text-primary-foreground"
        >
          Novo lançamento
        </button>
      </section>
    </main>
  );
}

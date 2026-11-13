import { Plus } from "lucide-react";
import Link from "next/link";

import { ComingSoon } from "@/components/layout/coming-soon";
import { MonthSwitcher } from "@/components/layout/month-switcher";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { currentHour, parseMonthParam } from "@/lib/dates";

function greeting() {
  const hour = currentHour();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  const user = await requireUser();
  const month = parseMonthParam((await searchParams).mes);
  const firstName = user.fullName.split(" ")[0];

  return (
    <>
      <PageHeader
        title={
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">
              {greeting()}, {firstName}
            </span>
            <MonthSwitcher month={month} />
          </div>
        }
        actions={
          <Button asChild className="hidden lg:inline-flex">
            <Link href="/lancamentos/novo">
              <Plus strokeWidth={2.5} aria-hidden />
              Novo lançamento
            </Link>
          </Button>
        }
      />
      <ComingSoon sprint="S6">
        O resumo do mês (saldo, gastos por categoria e próximos vencimentos)
        aparece aqui.
      </ComingSoon>
    </>
  );
}

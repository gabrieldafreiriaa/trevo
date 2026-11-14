import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/layout/user-badge";
import { InviteForm } from "@/features/admin/components/invite-form";
import { ResendButton } from "@/features/admin/components/resend-button";
import { listFamily } from "@/features/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { formatDateBR } from "@/lib/dates";

export const metadata: Metadata = { title: "Usuários" };

function signInLabel(iso: string | null) {
  if (!iso) return null;
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
  return `Último acesso em ${formatDateBR(date)}`;
}

export default async function AdminUsuariosPage() {
  const me = await requireAdmin();
  const family = await listFamily();

  return (
    <>
      <PageHeader
        title="Usuários"
        description="Quem usa o Trevo. Só o administrador vê esta tela."
      />

      <section className="flex flex-col gap-4 rounded-card border bg-card p-5 lg:p-6">
        <h2 className="text-[17px] font-semibold">Convidar alguém</h2>
        <InviteForm />
      </section>

      {family === null ? (
        <p className="rounded-xl bg-status-pending px-4 py-3 text-sm text-status-pending-foreground">
          Para listar e convidar usuários, configure a{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code> no servidor (no{" "}
          <code>.env.local</code> em desenvolvimento, na Vercel em produção).
        </p>
      ) : (
        <ul className="overflow-hidden rounded-card border bg-card">
          {family.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 border-b border-divider px-4 py-3.5 last:border-b-0 sm:gap-4"
            >
              <Avatar name={m.fullName} className="size-10" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-[15px] font-medium">
                  {m.fullName}
                  {m.id === me.id ? (
                    <span className="text-muted-foreground"> (você)</span>
                  ) : null}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {[m.email, m.role === "admin" ? "Administrador" : null]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                {m.active ? (
                  <span className="text-xs text-muted-foreground">
                    {signInLabel(m.lastSignInAt)}
                  </span>
                ) : null}
              </div>
              {m.active ? (
                <span className="rounded-full bg-status-paid px-2.5 py-1 text-[11px] font-semibold text-status-paid-foreground">
                  Ativo
                </span>
              ) : (
                <div className="flex flex-col items-end gap-1.5">
                  <span className="rounded-full bg-status-pending px-2.5 py-1 text-[11px] font-semibold text-status-pending-foreground">
                    Convite pendente
                  </span>
                  {m.email ? <ResendButton email={m.email} /> : null}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

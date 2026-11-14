import { BottomNav } from "@/components/layout/bottom-nav";
import { ReadOnlyBanner } from "@/components/layout/read-only-banner";
import { Sidebar } from "@/components/layout/sidebar";
import { listProfiles } from "@/features/admin/queries";
import { getViewContext } from "@/lib/auth/view";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const ctx = await getViewContext();
  const people = ctx.user.isAdmin ? await listProfiles() : [];

  return (
    <div className="flex min-h-dvh">
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-lg bg-graphite px-4 py-3 text-sm font-semibold text-graphite-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Pular para o conteúdo
      </a>
      <Sidebar
        fullName={ctx.user.fullName}
        isAdmin={ctx.user.isAdmin}
        selfId={ctx.user.id}
        ownerId={ctx.ownerId}
        people={people}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <main
          id="conteudo"
          tabIndex={-1}
          className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-5 pt-6 pb-32 outline-none lg:px-10 lg:pt-8 lg:pb-12"
        >
          {ctx.readOnly ? <ReadOnlyBanner ownerName={ctx.ownerName} /> : null}
          {children}
        </main>
      </div>
      <BottomNav readOnly={ctx.readOnly} />
    </div>
  );
}

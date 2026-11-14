import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-12">
      <div className="flex w-full max-w-[400px] flex-col gap-8">
        <Logo className="self-center" />
        <div className="rounded-card border bg-card p-6 sm:p-8">{children}</div>
      </div>
    </main>
  );
}

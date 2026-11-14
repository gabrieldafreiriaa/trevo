import { Construction } from "lucide-react";

/** Placeholder das telas que ainda serão construídas. */
export function ComingSoon({
  sprint,
  children,
}: {
  sprint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-input bg-card px-6 py-14 text-center">
      <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
        <Construction className="size-5" aria-hidden />
      </span>
      <p className="max-w-sm text-[15px]">{children}</p>
      <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
        Chega no {sprint}
      </span>
    </div>
  );
}

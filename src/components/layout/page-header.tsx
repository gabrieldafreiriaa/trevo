import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        {typeof title === "string" ? (
          <h1 className="font-display text-2xl font-semibold tracking-[-0.6px] lg:text-[30px] lg:tracking-[-0.8px]">
            {title}
          </h1>
        ) : (
          title
        )}
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions}
    </header>
  );
}

import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-24 w-full rounded-lg border border-input bg-card px-3.5 py-3 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:border-focus focus-visible:ring-[3px] focus-visible:ring-ring/30",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };

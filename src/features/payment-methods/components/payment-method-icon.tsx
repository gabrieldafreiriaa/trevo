import { cn } from "@/lib/utils";

import { PAYMENT_KINDS, type PaymentKind } from "../constants";

export function PaymentMethodIcon({
  kind,
  className,
}: {
  kind: PaymentKind;
  className?: string;
}) {
  const Icon = PAYMENT_KINDS[kind].icon;
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground",
        className,
      )}
    >
      <Icon className="size-5" />
    </span>
  );
}

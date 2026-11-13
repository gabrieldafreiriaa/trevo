import { cn } from "@/lib/utils";

import {
  STATUS_PILL,
  statusLabel,
  type EffectiveStatus,
  type TransactionType,
} from "../status";

export function StatusPill({
  status,
  type,
  className,
}: {
  status: EffectiveStatus;
  type: TransactionType;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-semibold whitespace-nowrap",
        STATUS_PILL[status],
        className,
      )}
    >
      {statusLabel(status, type)}
    </span>
  );
}

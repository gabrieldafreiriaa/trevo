import { createElement } from "react";

import { cn } from "@/lib/utils";

import { iconFor } from "../constants";

/** Ícone da categoria num quadrado com fundo claro da própria cor. */
export function CategoryIcon({
  icon,
  color,
  className,
}: {
  icon: string;
  color: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl",
        className,
      )}
      // Cor da categoria é dado do usuário (vem do banco), por isso inline.
      style={{ backgroundColor: `${color}1f`, color }}
    >
      {createElement(iconFor(icon), { className: "size-5" })}
    </span>
  );
}

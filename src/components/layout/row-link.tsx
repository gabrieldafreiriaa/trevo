import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * Link de uma linha de lista. No modo somente leitura (admin vendo outra pessoa)
 * vira um bloco comum, sem levar para telas de edição.
 */
export function RowLink({
  readOnly,
  href,
  ...props
}: ComponentProps<typeof Link> & { readOnly: boolean }) {
  if (readOnly) {
    const { className, children } = props;
    return (
      <div className={typeof className === "string" ? className : undefined}>
        {children}
      </div>
    );
  }
  return <Link href={href} {...props} />;
}

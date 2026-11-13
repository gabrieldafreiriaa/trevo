import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormFieldProps = ComponentProps<typeof Input> & {
  label: string;
  name: string;
  error?: string;
};

/** Rótulo + campo + mensagem de erro, com os atributos de acessibilidade ligados. */
export function FormField({
  label,
  name,
  error,
  id,
  ...props
}: FormFieldProps) {
  const inputId = id ?? name;
  const errorId = `${inputId}-error`;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        id={inputId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-[13px] text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function FormMessage({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: React.ReactNode;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={
        tone === "error"
          ? "rounded-lg bg-status-overdue px-3.5 py-3 text-sm text-status-overdue-foreground"
          : "rounded-lg bg-status-paid px-3.5 py-3 text-sm text-status-paid-foreground"
      }
    >
      {children}
    </p>
  );
}

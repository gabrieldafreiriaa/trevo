"use client";

import { Check } from "lucide-react";
import { useActionState, useState } from "react";

import { FormField, FormMessage } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/forms";
import { cn } from "@/lib/utils";

import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  CATEGORY_TYPE_LABEL,
  type CategoryType,
} from "../constants";
import { CategoryIcon } from "./category-badge";

type Values = { name: string; color: string; icon: string; type: CategoryType };

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  initial: Values;
  /** Na edição o tipo não muda (lançamentos dependem dele). */
  canChangeType: boolean;
  submitLabel: string;
};

export function CategoryForm({
  action,
  initial,
  canChangeType,
  submitLabel,
}: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const [color, setColor] = useState(initial.color);
  const [icon, setIcon] = useState(initial.icon);
  const [type, setType] = useState<CategoryType>(initial.type);
  const [name, setName] = useState(initial.name);

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {state.error ? (
        <FormMessage tone="error">{state.error}</FormMessage>
      ) : null}

      <div className="flex items-center gap-3 rounded-xl bg-secondary p-3">
        <CategoryIcon icon={icon} color={color} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">
            {name.trim() || "Nova categoria"}
          </span>
          <span className="text-xs text-muted-foreground">
            {CATEGORY_TYPE_LABEL[type]}
          </span>
        </div>
      </div>

      {canChangeType ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-[13px] font-medium">Tipo</legend>
          <div className="grid max-w-xs grid-cols-2 gap-1 rounded-xl bg-secondary p-1">
            {(["expense", "income"] as const).map((t) => (
              <label
                key={t}
                className={cn(
                  "flex h-11 cursor-pointer items-center justify-center rounded-[10px] text-sm font-semibold has-focus-visible:ring-[3px] has-focus-visible:ring-focus",
                  type === t
                    ? "bg-card text-foreground shadow-[0_0_0_1px_var(--border)]"
                    : "text-muted-foreground",
                )}
              >
                <input
                  type="radio"
                  name="type"
                  value={t}
                  checked={type === t}
                  onChange={() => setType(t)}
                  className="sr-only"
                />
                {t === "expense" ? "Saída" : "Entrada"}
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <input type="hidden" name="type" value={type} />
      )}

      <FormField
        label="Nome"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={40}
        placeholder="Ex.: Moto, Farmácia, Aluguel"
        autoComplete="off"
        required
        error={state.fieldErrors?.name}
      />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-[13px] font-medium">Cor</legend>
        <div className="flex flex-wrap gap-2.5">
          {CATEGORY_COLORS.map((c) => (
            <label
              key={c.value}
              title={c.label}
              className="relative flex size-11 cursor-pointer items-center justify-center rounded-full has-focus-visible:ring-[3px] has-focus-visible:ring-focus"
              style={{ backgroundColor: c.value }}
            >
              <input
                type="radio"
                name="color"
                value={c.value}
                checked={color === c.value}
                onChange={() => setColor(c.value)}
                className="sr-only"
                aria-label={c.label}
              />
              {color === c.value ? (
                <Check
                  className="size-5 text-white"
                  strokeWidth={3}
                  aria-hidden
                />
              ) : null}
            </label>
          ))}
        </div>
        {state.fieldErrors?.color ? (
          <p className="text-[13px] text-destructive">
            {state.fieldErrors.color}
          </p>
        ) : null}
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-[13px] font-medium">Ícone</legend>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-2">
          {Object.entries(CATEGORY_ICONS).map(
            ([key, { icon: Icon, label }]) => (
              <label
                key={key}
                title={label}
                className={cn(
                  "flex size-11 cursor-pointer items-center justify-center rounded-xl border has-focus-visible:ring-[3px] has-focus-visible:ring-focus",
                  icon === key
                    ? "border-transparent"
                    : "border-input bg-card text-muted-foreground",
                )}
                style={
                  icon === key
                    ? { backgroundColor: `${color}1f`, color }
                    : undefined
                }
              >
                <input
                  type="radio"
                  name="icon"
                  value={key}
                  checked={icon === key}
                  onChange={() => setIcon(key)}
                  className="sr-only"
                  aria-label={label}
                />
                <Icon className="size-5" aria-hidden />
              </label>
            ),
          )}
        </div>
        {state.fieldErrors?.icon ? (
          <p className="text-[13px] text-destructive">
            {state.fieldErrors.icon}
          </p>
        ) : null}
      </fieldset>

      <Button type="submit" variant="graphite" size="lg" disabled={pending}>
        {pending ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}

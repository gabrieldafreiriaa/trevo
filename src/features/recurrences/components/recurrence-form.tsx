"use client";

import { createElement, useActionState, useState } from "react";

import { ChoiceChips } from "@/components/form/choice-chips";
import { FormField, FormMessage } from "@/components/form/form-field";
import { MoneyInput } from "@/components/form/money-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { iconFor } from "@/features/categories/constants";
import { PAYMENT_KINDS } from "@/features/payment-methods/constants";
import type { FormOptions } from "@/features/transactions/queries";
import type { TransactionType } from "@/features/transactions/status";
import type { FormState } from "@/lib/forms";
import { cn } from "@/lib/utils";

export type RecurrenceFormValues = {
  type: TransactionType;
  description: string;
  amount_cents: number;
  category_id: string;
  payment_method_id: string;
  day_of_month: number;
  starts_on: string;
  ends_on: string;
};

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  options: FormOptions;
  initial: RecurrenceFormValues;
  canChangeType: boolean;
  submitLabel: string;
};

const dateClass =
  "h-12 w-full rounded-lg border border-input bg-card px-3.5 text-[15px] outline-none focus-visible:border-focus focus-visible:ring-[3px] focus-visible:ring-ring/30";

export function RecurrenceForm({
  action,
  options,
  initial,
  canChangeType,
  submitLabel,
}: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const [type, setType] = useState<TransactionType>(initial.type);
  const [categoryId, setCategoryId] = useState(initial.category_id);
  const [paymentMethodId, setPaymentMethodId] = useState(
    initial.payment_method_id,
  );
  const errors = state.fieldErrors ?? {};
  const isIncome = type === "income";

  const categories = options.categories.filter(
    (c) => c.type === type && (!c.archived_at || c.id === initial.category_id),
  );
  const paymentMethods = options.paymentMethods.filter(
    (p) => !p.archived_at || p.id === initial.payment_method_id,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {state.error ? (
        <FormMessage tone="error">{state.error}</FormMessage>
      ) : null}
      <input type="hidden" name="type" value={type} />

      {canChangeType ? (
        <div
          role="group"
          aria-label="Tipo"
          className="grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1"
        >
          {(["expense", "income"] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              onClick={() => {
                setType(t);
                setCategoryId("");
              }}
              className={cn(
                "h-11 cursor-pointer rounded-[10px] text-sm font-semibold",
                type === t
                  ? cn(
                      "bg-card shadow-[0_0_0_1px_var(--border)]",
                      t === "expense" ? "text-expense" : "text-income",
                    )
                  : "text-muted-foreground",
              )}
            >
              {t === "expense" ? "Conta a pagar" : "Valor a receber"}
            </button>
          ))}
        </div>
      ) : null}

      <MoneyInput
        name="amount_cents"
        label="Valor por mês"
        size="hero"
        defaultCents={initial.amount_cents}
        toneClassName={isIncome ? "text-income" : "text-expense"}
        error={errors.amount_cents}
      />

      <FormField
        label="Descrição"
        name="description"
        defaultValue={initial.description}
        maxLength={80}
        placeholder={isIncome ? "Ex.: Salário" : "Ex.: Aluguel, Internet"}
        autoComplete="off"
        error={errors.description}
      />

      <ChoiceChips
        name="category_id"
        legend="Categoria"
        value={categoryId}
        onChange={setCategoryId}
        error={errors.category_id}
        options={categories.map((c) => ({
          value: c.id,
          label: c.name,
          icon: createElement(iconFor(c.icon), {
            className: "size-4",
            style: c.id === categoryId ? undefined : { color: c.color },
            "aria-hidden": true,
          }),
        }))}
      />

      <ChoiceChips
        name="payment_method_id"
        legend={isIncome ? "Recebido por (opcional)" : "Forma de pagamento"}
        value={paymentMethodId}
        onChange={setPaymentMethodId}
        error={errors.payment_method_id}
        options={[
          ...(isIncome ? [{ value: "", label: "Não informar" }] : []),
          ...paymentMethods.map((p) => ({
            value: p.id,
            label: p.name,
            icon: createElement(PAYMENT_KINDS[p.kind].icon, {
              className: "size-4",
              "aria-hidden": true,
            }),
          })),
        ]}
      />

      <FormField
        label="Todo dia"
        name="day_of_month"
        inputMode="numeric"
        defaultValue={String(initial.day_of_month)}
        maxLength={2}
        className="max-w-28"
        error={errors.day_of_month}
      />
      <p className="-mt-4 text-[13px] text-muted-foreground">
        Em meses sem esse dia (ex.: 31 em fevereiro), cai no último dia do mês.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="starts_on">Começa em</Label>
          <input
            id="starts_on"
            name="starts_on"
            type="date"
            defaultValue={initial.starts_on}
            className={dateClass}
          />
          {errors.starts_on ? (
            <p className="text-[13px] text-destructive">{errors.starts_on}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ends_on">Termina em (opcional)</Label>
          <input
            id="ends_on"
            name="ends_on"
            type="date"
            defaultValue={initial.ends_on}
            className={dateClass}
          />
          {errors.ends_on ? (
            <p className="text-[13px] text-destructive">{errors.ends_on}</p>
          ) : null}
        </div>
      </div>

      <Button type="submit" variant="graphite" size="lg" disabled={pending}>
        {pending ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}

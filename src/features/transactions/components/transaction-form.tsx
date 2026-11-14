"use client";

import { ChevronDown } from "lucide-react";
import { createElement, useActionState, useMemo, useState } from "react";

import { ChoiceChips } from "@/components/form/choice-chips";
import { FormField, FormMessage } from "@/components/form/form-field";
import { MoneyInput } from "@/components/form/money-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { iconFor } from "@/features/categories/constants";
import { PAYMENT_KINDS } from "@/features/payment-methods/constants";
import type { FormState } from "@/lib/forms";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

import type { FormOptions } from "../queries";
import type { StoredStatus, TransactionType } from "../status";
import { RepeatFields } from "./repeat-fields";

export type TransactionFormValues = {
  type: TransactionType;
  amount_cents: number;
  interest_cents: number;
  paid_cents: number;
  description: string;
  category_id: string;
  payment_method_id: string;
  client_id: string;
  due_date: string;
  status: StoredStatus;
  notes: string;
};

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  options: FormOptions;
  initial: TransactionFormValues;
  submitLabel: string;
  /** Só no NOVO lançamento: parcelado / todo mês. */
  allowRepeat?: boolean;
};

export function TransactionForm({
  action,
  options,
  initial,
  submitLabel,
  allowRepeat = false,
}: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const [type, setType] = useState<TransactionType>(initial.type);
  const [categoryId, setCategoryId] = useState(initial.category_id);
  const [paymentMethodId, setPaymentMethodId] = useState(
    initial.payment_method_id,
  );
  const [status, setStatus] = useState<StoredStatus>(initial.status);
  const [amount, setAmount] = useState(initial.amount_cents);
  const [interest, setInterest] = useState(initial.interest_cents);
  const [paid, setPaid] = useState(initial.paid_cents);
  const [dueDate, setDueDate] = useState(initial.due_date);
  const errors = state.fieldErrors ?? {};

  // Só categorias ativas do tipo escolhido (+ a já usada, mesmo arquivada).
  const categories = useMemo(
    () =>
      options.categories.filter(
        (c) =>
          c.type === type && (!c.archived_at || c.id === initial.category_id),
      ),
    [options.categories, type, initial.category_id],
  );
  const paymentMethods = options.paymentMethods.filter(
    (p) => !p.archived_at || p.id === initial.payment_method_id,
  );

  const switchType = (t: TransactionType) => {
    setType(t);
    if (!options.categories.some((c) => c.id === categoryId && c.type === t))
      setCategoryId("");
  };

  const isIncome = type === "income";
  const due = amount + interest;

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {state.error ? (
        <FormMessage tone="error">{state.error}</FormMessage>
      ) : null}

      <input type="hidden" name="type" value={type} />
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
            onClick={() => switchType(t)}
            className={cn(
              "h-11 cursor-pointer rounded-[10px] text-sm font-semibold transition-colors",
              type === t
                ? cn(
                    "bg-card shadow-[0_0_0_1px_var(--border)]",
                    t === "expense" ? "text-expense" : "text-income",
                  )
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "expense" ? "Saída" : "Entrada"}
          </button>
        ))}
      </div>

      <MoneyInput
        name="amount_cents"
        label="Valor"
        size="hero"
        defaultCents={initial.amount_cents}
        toneClassName={isIncome ? "text-income" : "text-expense"}
        onChangeCents={setAmount}
        error={errors.amount_cents}
      />

      <FormField
        label="Descrição"
        name="description"
        defaultValue={initial.description}
        maxLength={80}
        placeholder={
          isIncome ? "Ex.: Salário, Venda da moto" : "Ex.: Mercado do bairro"
        }
        autoComplete="off"
        required
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

      {isIncome && options.clients.length ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="client_id">Cliente (opcional)</Label>
          <select
            id="client_id"
            name="client_id"
            defaultValue={initial.client_id}
            className="h-12 w-full cursor-pointer rounded-lg border border-input bg-card px-3.5 text-[15px] outline-none focus-visible:border-focus focus-visible:ring-[3px] focus-visible:ring-ring/30"
          >
            <option value="">Nenhum</option>
            {options.clients
              .filter((c) => !c.archived_at || c.id === initial.client_id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
          <p className="text-[13px] text-muted-foreground">
            Use para a entrada (sinal) de uma venda: ela soma no histórico do
            cliente.
          </p>
        </div>
      ) : (
        <input type="hidden" name="client_id" value="" />
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="due_date">
          {status === "paid" ? "Data" : "Vencimento"}
        </Label>
        <input
          id="due_date"
          name="due_date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
          aria-invalid={errors.due_date ? true : undefined}
          className="h-12 w-full rounded-lg border border-input bg-card px-3.5 text-[15px] outline-none focus-visible:border-focus focus-visible:ring-[3px] focus-visible:ring-ring/30"
        />
        {errors.due_date ? (
          <p className="text-[13px] text-destructive">{errors.due_date}</p>
        ) : null}
      </div>

      {allowRepeat ? (
        <RepeatFields
          amountCents={amount}
          firstDate={dueDate}
          isIncome={isIncome}
          errors={errors}
        />
      ) : null}

      <ChoiceChips
        name="status"
        legend="Situação"
        columns={3}
        value={status}
        onChange={(v) => setStatus(v as StoredStatus)}
        error={errors.status}
        options={[
          { value: "paid", label: isIncome ? "Recebido" : "Pago" },
          { value: "pending", label: "Pendente" },
          { value: "partial", label: "Parcial" },
        ]}
      />

      {status === "partial" ? (
        <MoneyInput
          name="paid_cents"
          label={isIncome ? "Quanto já recebeu" : "Quanto já pagou"}
          defaultCents={initial.paid_cents}
          onChangeCents={setPaid}
          error={errors.paid_cents}
          hint={
            due > paid ? (
              <>Faltam {formatBRL(due - paid)}</>
            ) : (
              <>Esse valor quita tudo.</>
            )
          }
        />
      ) : (
        <input type="hidden" name="paid_cents" value="0" />
      )}

      <details
        className="group rounded-xl border border-input bg-card"
        open={initial.interest_cents > 0 || Boolean(initial.notes) || undefined}
      >
        <summary className="flex h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-medium">
          Juros e observação
          <ChevronDown
            className="size-4 transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <div className="flex flex-col gap-5 border-t border-divider p-4">
          <MoneyInput
            name="interest_cents"
            label="Juros ou multa"
            defaultCents={initial.interest_cents}
            onChangeCents={setInterest}
            error={errors.interest_cents}
            hint={
              interest > 0 ? (
                <>Valor devido: {formatBRL(due)}</>
              ) : (
                <>
                  Use quando houver atraso combinado. O valor original não muda.
                </>
              )
            }
          />
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Observação</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={initial.notes}
              maxLength={500}
              placeholder="Opcional"
            />
            {errors.notes ? (
              <p className="text-[13px] text-destructive">{errors.notes}</p>
            ) : null}
          </div>
        </div>
      </details>

      <Button type="submit" variant="graphite" size="lg" disabled={pending}>
        {pending ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}

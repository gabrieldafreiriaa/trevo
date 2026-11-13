"use client";

import { createElement, useActionState, useState } from "react";

import { ChoiceChips } from "@/components/form/choice-chips";
import { FormField, FormMessage } from "@/components/form/form-field";
import { MoneyInput } from "@/components/form/money-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { iconFor } from "@/features/categories/constants";
import { PAYMENT_KINDS } from "@/features/payment-methods/constants";
import type { AmountMode } from "@/features/transactions/installments";
import type { FormOptions } from "@/features/transactions/queries";
import {
  formatDateBR,
  isValidISODate,
  type InstallmentInterval,
} from "@/lib/dates";
import type { FormState } from "@/lib/forms";

import { buildSalePlan } from "../sale";
import { formatBRL } from "@/lib/money";

type IntervalKind = "monthly" | "biweekly" | "days";

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  options: FormOptions;
  defaultCategoryId: string;
  firstDate: string;
  /** Hoje (São Paulo), vindo do servidor: data padrão da entrada. */
  today: string;
};

export function SaleForm({
  action,
  options,
  defaultCategoryId,
  firstDate: initialDate,
  today,
}: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};

  const [amount, setAmount] = useState(0);
  const [mode, setMode] = useState<AmountMode>("total");
  const [count, setCount] = useState("5");
  const [firstDate, setFirstDate] = useState(initialDate);
  const [intervalKind, setIntervalKind] = useState<IntervalKind>("monthly");
  const [days, setDays] = useState("10");
  const [categoryId, setCategoryId] = useState(defaultCategoryId);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [hasDown, setHasDown] = useState(false);
  const [downAmount, setDownAmount] = useState(0);
  const [downDate, setDownDate] = useState(today);
  const [downMethodId, setDownMethodId] = useState("");
  const [downStatus, setDownStatus] = useState<"paid" | "pending">("paid");

  const n = Number(count);
  const every = Number(days);
  const interval: InstallmentInterval | null =
    intervalKind === "monthly"
      ? { kind: "monthly" }
      : intervalKind === "biweekly"
        ? { kind: "biweekly" }
        : every >= 1 && every <= 365
          ? { kind: "days", every }
          : null;

  const sale =
    amount > 0 &&
    Number.isInteger(n) &&
    n >= 1 &&
    n <= 48 &&
    interval &&
    isValidISODate(firstDate)
      ? buildSalePlan({
          amountCents: amount,
          mode,
          count: n,
          firstDate,
          interval,
          downPaymentCents: hasDown ? downAmount : 0,
        })
      : null;
  const plan = sale?.installments ?? [];
  const downTooBig =
    mode === "total" && hasDown && downAmount > 0 && amount > 0 && !sale;

  const categories = options.categories.filter(
    (c) => c.type === "income" && !c.archived_at,
  );
  const methods = options.paymentMethods.filter((p) => !p.archived_at);

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {state.error ? (
        <FormMessage tone="error">{state.error}</FormMessage>
      ) : null}

      <FormField
        label="O que foi vendido"
        name="description"
        maxLength={80}
        placeholder="Ex.: Moto CG 160"
        autoComplete="off"
        error={errors.description}
      />

      <ChoiceChips
        name="amount_mode"
        legend="Como você quer informar o valor"
        columns={2}
        value={mode}
        onChange={(v) => setMode(v as AmountMode)}
        options={[
          { value: "total", label: "Total da venda" },
          { value: "each", label: "Valor da parcela" },
        ]}
      />

      <MoneyInput
        name="amount_cents"
        label={
          mode === "each"
            ? "Valor de cada parcela"
            : hasDown
              ? "Total da venda (já com a entrada)"
              : "Total da venda"
        }
        size="hero"
        toneClassName="text-income"
        onChangeCents={setAmount}
        error={errors.amount_cents}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="installment_count">Parcelas</Label>
          <Input
            id="installment_count"
            name="installment_count"
            inputMode="numeric"
            value={count}
            onChange={(e) =>
              setCount(e.target.value.replace(/\D/g, "").slice(0, 2))
            }
            aria-invalid={errors.installment_count ? true : undefined}
          />
          {errors.installment_count ? (
            <p className="text-[13px] text-destructive">
              {errors.installment_count}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="first_date">1ª parcela em</Label>
          <input
            id="first_date"
            name="first_date"
            type="date"
            value={firstDate}
            onChange={(e) => setFirstDate(e.target.value)}
            className="h-12 w-full rounded-lg border border-input bg-card px-3.5 text-[15px] outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/30"
          />
          {errors.first_date ? (
            <p className="text-[13px] text-destructive">{errors.first_date}</p>
          ) : null}
        </div>
      </div>

      <ChoiceChips
        name="interval_kind"
        legend="Intervalo entre as parcelas"
        columns={3}
        value={intervalKind}
        onChange={(v) => setIntervalKind(v as IntervalKind)}
        options={[
          { value: "monthly", label: "Mensal" },
          { value: "biweekly", label: "15 dias" },
          { value: "days", label: "A cada N dias" },
        ]}
      />
      {intervalKind === "days" ? (
        <div className="-mt-2 flex flex-col gap-2">
          <Label htmlFor="interval_days">A cada quantos dias</Label>
          <Input
            id="interval_days"
            name="interval_days"
            inputMode="numeric"
            value={days}
            onChange={(e) =>
              setDays(e.target.value.replace(/\D/g, "").slice(0, 3))
            }
            className="max-w-28"
          />
          {errors.interval_days ? (
            <p className="text-[13px] text-destructive">
              {errors.interval_days}
            </p>
          ) : null}
        </div>
      ) : (
        <input type="hidden" name="interval_days" value="" />
      )}

      <div className="flex flex-col gap-4 rounded-xl border border-input p-4">
        <label className="flex cursor-pointer items-center justify-between gap-3">
          <span className="flex flex-col">
            <span className="text-[15px] font-medium">Teve entrada?</span>
            <span className="text-[13px] text-muted-foreground">
              O sinal fica junto da venda no carnê.
            </span>
          </span>
          <input
            type="checkbox"
            name="has_down_payment"
            checked={hasDown}
            onChange={(e) => setHasDown(e.target.checked)}
            className="size-6 cursor-pointer accent-graphite"
          />
        </label>

        {hasDown ? (
          <>
            <MoneyInput
              name="down_amount_cents"
              label="Valor da entrada"
              onChangeCents={setDownAmount}
              error={
                downTooBig
                  ? "A entrada precisa ser menor que o total da venda."
                  : errors.down_amount_cents
              }
              hint={
                mode === "total" && sale && hasDown && downAmount > 0 ? (
                  <>
                    Fica {formatBRL(sale.financedCents)} para dividir nas
                    parcelas.
                  </>
                ) : undefined
              }
            />
            <div className="flex flex-col gap-2">
              <Label htmlFor="down_date">Data da entrada</Label>
              <input
                id="down_date"
                name="down_date"
                type="date"
                value={downDate}
                onChange={(e) => setDownDate(e.target.value)}
                className="h-12 w-full rounded-lg border border-input bg-card px-3.5 text-[15px] outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/30"
              />
              {errors.down_date ? (
                <p className="text-[13px] text-destructive">
                  {errors.down_date}
                </p>
              ) : null}
            </div>
            <ChoiceChips
              name="down_payment_method_id"
              legend="Como foi paga"
              value={downMethodId}
              onChange={setDownMethodId}
              options={[
                { value: "", label: "Não informar" },
                ...methods.map((p) => ({
                  value: p.id,
                  label: p.name,
                  icon: createElement(PAYMENT_KINDS[p.kind].icon, {
                    className: "size-4",
                    "aria-hidden": true,
                  }),
                })),
              ]}
            />
            <ChoiceChips
              name="down_status"
              legend="Situação da entrada"
              columns={2}
              value={downStatus}
              onChange={(v) => setDownStatus(v as "paid" | "pending")}
              options={[
                { value: "paid", label: "Já recebi" },
                { value: "pending", label: "Ainda vou receber" },
              ]}
            />
          </>
        ) : (
          <>
            <input type="hidden" name="down_amount_cents" value="0" />
            <input type="hidden" name="down_date" value="" />
            <input type="hidden" name="down_payment_method_id" value="" />
            <input type="hidden" name="down_status" value="paid" />
          </>
        )}
      </div>

      {plan.length ? (
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium">
            {hasDown && downAmount > 0
              ? `Entrada de ${formatBRL(downAmount)} + `
              : ""}
            {plan.length === 1 ? "1 parcela" : `${plan.length}x`} · total{" "}
            {formatBRL(sale?.totalCents ?? 0)}
          </span>
          <ol className="flex max-h-56 flex-col overflow-y-auto rounded-lg bg-secondary text-sm">
            {plan.map((p) => (
              <li
                key={p.number}
                className="flex justify-between border-b border-divider px-3 py-2 last:border-b-0"
              >
                <span className="text-muted-foreground">
                  {p.number}/{plan.length} · {formatDateBR(p.due_date)}
                </span>
                <span className="font-medium tabular-nums">
                  {formatBRL(p.amount_cents)}
                </span>
              </li>
            ))}
          </ol>
          <p className="text-[13px] text-muted-foreground">
            As parcelas entram como <strong>a receber</strong> e aparecem no
            previsto de cada mês. A entrada (sinal), se houver, lance como uma
            entrada comum ligada a este cliente.
          </p>
        </div>
      ) : null}

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
        legend="Como o cliente vai pagar (opcional)"
        value={paymentMethodId}
        onChange={setPaymentMethodId}
        options={[
          { value: "", label: "Não informar" },
          ...methods.map((p) => ({
            value: p.id,
            label: p.name,
            icon: createElement(PAYMENT_KINDS[p.kind].icon, {
              className: "size-4",
              "aria-hidden": true,
            }),
          })),
        ]}
      />

      <Button type="submit" variant="graphite" size="lg" disabled={pending}>
        {pending ? "Salvando…" : "Registrar venda"}
      </Button>
    </form>
  );
}

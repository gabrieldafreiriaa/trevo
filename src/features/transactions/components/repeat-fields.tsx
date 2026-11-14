"use client";

import { useState } from "react";

import { ChoiceChips } from "@/components/form/choice-chips";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatDateBR,
  isValidISODate,
  type InstallmentInterval,
} from "@/lib/dates";
import { formatBRL } from "@/lib/money";

import { buildInstallments, planTotal, type AmountMode } from "../installments";

type Repeat = "none" | "installments" | "monthly";
type IntervalKind = "monthly" | "biweekly" | "days";

type Props = {
  amountCents: number;
  firstDate: string;
  isIncome: boolean;
  errors: Partial<Record<string, string>>;
};

/** "Repetir": não repete / parcelado / todo mês, com prévia das parcelas. */
export function RepeatFields({
  amountCents,
  firstDate,
  isIncome,
  errors,
}: Props) {
  const [repeat, setRepeat] = useState<Repeat>("none");
  const [count, setCount] = useState("2");
  const [mode, setMode] = useState<AmountMode>("total");
  const [intervalKind, setIntervalKind] = useState<IntervalKind>("monthly");
  const [days, setDays] = useState("10");

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

  const canPreview =
    repeat === "installments" &&
    amountCents > 0 &&
    Number.isInteger(n) &&
    n >= 2 &&
    n <= 48 &&
    interval &&
    isValidISODate(firstDate);
  const plan = canPreview
    ? buildInstallments({ amountCents, mode, count: n, firstDate, interval })
    : [];

  const day = isValidISODate(firstDate) ? Number(firstDate.slice(8, 10)) : null;

  return (
    <div className="flex flex-col gap-5">
      <ChoiceChips
        name="repeat"
        legend="Repetir"
        columns={3}
        value={repeat}
        onChange={(v) => setRepeat(v as Repeat)}
        options={[
          { value: "none", label: "Não repete" },
          { value: "installments", label: "Parcelado" },
          { value: "monthly", label: "Todo mês" },
        ]}
      />

      {repeat === "monthly" ? (
        <p className="rounded-xl bg-secondary px-4 py-3 text-sm text-muted-foreground">
          Vira uma conta fixa: o lançamento se repete todo dia {day ?? "—"}, e
          os próximos 3 meses já aparecem como previstos. Para pausar ou mudar o
          valor, use <strong>Recorrentes</strong>.
        </p>
      ) : null}

      {repeat === "installments" ? (
        <div className="flex flex-col gap-5 rounded-xl border border-input p-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="installment_count">Número de parcelas</Label>
            <Input
              id="installment_count"
              name="installment_count"
              inputMode="numeric"
              value={count}
              onChange={(e) =>
                setCount(e.target.value.replace(/\D/g, "").slice(0, 2))
              }
              className="max-w-28"
              aria-invalid={errors.installment_count ? true : undefined}
            />
            {errors.installment_count ? (
              <p className="text-[13px] text-destructive">
                {errors.installment_count}
              </p>
            ) : null}
          </div>

          <ChoiceChips
            name="amount_mode"
            legend="O valor digitado é"
            columns={2}
            value={mode}
            onChange={(v) => setMode(v as AmountMode)}
            options={[
              {
                value: "total",
                label: isIncome ? "Total da venda" : "Total da compra",
              },
              { value: "each", label: "Valor de cada parcela" },
            ]}
          />

          <ChoiceChips
            name="interval_kind"
            legend="Intervalo"
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
            <div className="flex flex-col gap-2">
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
                aria-invalid={errors.interval_days ? true : undefined}
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

          {plan.length ? (
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-medium">
                {plan.length}x · total {formatBRL(planTotal(plan))}
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
                A situação escolhida abaixo vale para a 1ª parcela. As outras
                ficam pendentes.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

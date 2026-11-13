import {
  Banknote,
  CreditCard,
  QrCode,
  Receipt,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { Enums } from "@/lib/supabase/database.types";

export type PaymentKind = Enums<"payment_kind">;

export const PAYMENT_KINDS: Record<
  PaymentKind,
  { label: string; icon: LucideIcon }
> = {
  credit_card: { label: "Cartão de crédito", icon: CreditCard },
  debit_card: { label: "Cartão de débito", icon: CreditCard },
  pix: { label: "Pix", icon: QrCode },
  cash: { label: "Dinheiro", icon: Banknote },
  boleto: { label: "Boleto", icon: Receipt },
  other: { label: "Outro", icon: Wallet },
};

export const PAYMENT_KIND_ORDER: PaymentKind[] = [
  "credit_card",
  "debit_card",
  "pix",
  "cash",
  "boleto",
  "other",
];

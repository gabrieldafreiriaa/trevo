import {
  Baby,
  Briefcase,
  Bus,
  Car,
  CircleEllipsis,
  Coffee,
  Dumbbell,
  Fuel,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  Laptop,
  PartyPopper,
  PawPrint,
  PiggyBank,
  Plane,
  Receipt,
  Repeat,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Store,
  TrendingUp,
  Undo2,
  Utensils,
  Wallet,
  Wifi,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type { Enums } from "@/lib/supabase/database.types";

export type CategoryType = Enums<"transaction_type">;

export const CATEGORY_TYPE_LABEL: Record<CategoryType, string> = {
  expense: "Saídas",
  income: "Entradas",
};

/** Na URL usamos os nomes em português. */
export const TYPE_PARAM: Record<CategoryType, string> = {
  expense: "saidas",
  income: "entradas",
};

export function typeFromParam(value: unknown): CategoryType {
  return value === TYPE_PARAM.income ? "income" : "expense";
}

/**
 * Paleta das categorias. São DADOS (gravados no banco), não tokens de interface.
 * Todas têm contraste suficiente como cor de ícone sobre um fundo claro dela mesma.
 */
export const CATEGORY_COLORS = [
  { value: "#22c55e", label: "Verde" },
  { value: "#14b8a6", label: "Turquesa" },
  { value: "#3b82f6", label: "Azul" },
  { value: "#6366f1", label: "Índigo" },
  { value: "#8b5cf6", label: "Roxo" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#ef4444", label: "Vermelho" },
  { value: "#f97316", label: "Laranja" },
  { value: "#f59e0b", label: "Amarelo" },
  { value: "#64748b", label: "Cinza" },
] as const;

export const DEFAULT_COLOR = "#64748b";

/** Ícones disponíveis (chave gravada no banco → componente). */
export const CATEGORY_ICONS: Record<
  string,
  { icon: LucideIcon; label: string }
> = {
  house: { icon: House, label: "Casa" },
  "shopping-cart": { icon: ShoppingCart, label: "Mercado" },
  utensils: { icon: Utensils, label: "Restaurante" },
  coffee: { icon: Coffee, label: "Café" },
  car: { icon: Car, label: "Carro" },
  fuel: { icon: Fuel, label: "Combustível" },
  bus: { icon: Bus, label: "Ônibus" },
  plane: { icon: Plane, label: "Viagem" },
  "heart-pulse": { icon: HeartPulse, label: "Saúde" },
  dumbbell: { icon: Dumbbell, label: "Academia" },
  "graduation-cap": { icon: GraduationCap, label: "Educação" },
  baby: { icon: Baby, label: "Filhos" },
  "paw-print": { icon: PawPrint, label: "Pet" },
  "party-popper": { icon: PartyPopper, label: "Lazer" },
  gift: { icon: Gift, label: "Presente" },
  "shopping-bag": { icon: ShoppingBag, label: "Compras" },
  shirt: { icon: Shirt, label: "Roupas" },
  smartphone: { icon: Smartphone, label: "Celular" },
  wifi: { icon: Wifi, label: "Internet" },
  zap: { icon: Zap, label: "Energia" },
  wrench: { icon: Wrench, label: "Manutenção" },
  repeat: { icon: Repeat, label: "Assinatura" },
  receipt: { icon: Receipt, label: "Conta" },
  landmark: { icon: Landmark, label: "Banco/Impostos" },
  briefcase: { icon: Briefcase, label: "Salário" },
  store: { icon: Store, label: "Vendas" },
  laptop: { icon: Laptop, label: "Freela" },
  "undo-2": { icon: Undo2, label: "Reembolso" },
  "trending-up": { icon: TrendingUp, label: "Rendimentos" },
  "piggy-bank": { icon: PiggyBank, label: "Poupança" },
  wallet: { icon: Wallet, label: "Carteira" },
  "circle-ellipsis": { icon: CircleEllipsis, label: "Outros" },
};

export const DEFAULT_ICON = "circle-ellipsis";

export function iconFor(key: string): LucideIcon {
  return CATEGORY_ICONS[key]?.icon ?? CircleEllipsis;
}

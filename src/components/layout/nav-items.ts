import {
  CreditCard,
  House,
  List,
  Repeat,
  Tag,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const mainNav: NavItem[] = [
  { href: "/", label: "Início", icon: House },
  { href: "/lancamentos", label: "Lançamentos", icon: List },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/recorrentes", label: "Recorrentes", icon: Repeat },
  { href: "/categorias", label: "Categorias", icon: Tag },
  {
    href: "/formas-de-pagamento",
    label: "Formas de pagamento",
    icon: CreditCard,
  },
];

export const adminNav: NavItem[] = [
  { href: "/admin/usuarios", label: "Usuários", icon: UserCog },
];

export function isActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  CreditCard,
  Target,
  FolderOpen,
} from 'lucide-react';

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

/** Primary pages, shown in the desktop orbit and the mobile bottom bar. */
export const MAIN_NAV: NavItem[] = [
  { path: '/', label: 'Visão geral', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transações', icon: ArrowLeftRight },
  { path: '/accounts', label: 'Contas', icon: Wallet },
  { path: '/credit-cards', label: 'Cartões', icon: CreditCard },
];

/** Every page, shown in the full-options menu. */
export const ALL_NAV: NavItem[] = [
  { path: '/', label: 'Visão geral', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transações', icon: ArrowLeftRight },
  { path: '/budgets', label: 'Orçamento', icon: Target },
  { path: '/accounts', label: 'Contas', icon: Wallet },
  { path: '/credit-cards', label: 'Cartões', icon: CreditCard },
  { path: '/categories', label: 'Categorias', icon: FolderOpen },
];

import type { TransactionFilters } from '../types';

export const queryKeys = {
  transactions: {
    all: ['transactions'] as const,
    list: (filters: TransactionFilters) =>
      ['transactions', 'list', filters] as const,
    availableMonths: ['transactions', 'available-months'] as const,
    lastMonths: (months: number) =>
      ['transactions', 'last-months', months] as const,
  },
  accounts: {
    all: ['accounts'] as const,
    byType: (type: string) => ['accounts', type] as const,
  },
  categories: {
    all: ['categories'] as const,
    byType: (type: string) => ['categories', type] as const,
  },
  budgets: {
    all: ['budgets'] as const,
    overview: (month: string) => ['budgets', month] as const,
  },
  invoices: {
    all: ['invoices'] as const,
    byAccount: (accountId: string) => ['invoices', accountId] as const,
    detail: (accountId: string, year: number, month: number) =>
      ['invoices', accountId, year, month] as const,
  },
  scheduledPayments: {
    all: ['scheduled-payments'] as const,
    list: (status: string) => ['scheduled-payments', status] as const,
  },
};

import { format, parseISO } from 'date-fns';
import type { Account, Transaction, TransactionType } from '../types';

export type FinancialView = 'all' | 'consumption' | 'cashFlow';

const INVESTMENT_CATEGORY_NAME = 'Investimentos';

const normalizeCategoryName = (name?: string): string =>
  (name ?? '').trim().toLocaleLowerCase('pt-BR');

interface CategorizableExpense {
  type: TransactionType;
  category?: { name?: string } | null;
}

export const isInvestmentTransaction = (
  transaction: CategorizableExpense
): boolean =>
  transaction.type === 'expense' &&
  normalizeCategoryName(transaction.category?.name) ===
    normalizeCategoryName(INVESTMENT_CATEGORY_NAME);

export const isConsumptionTransaction = (transaction: Transaction): boolean =>
  !transaction.isPayment;

export const isCashFlowTransaction = (
  transaction: Transaction,
  accounts: Account[]
): boolean => {
  if (transaction.isPayment) return true;

  const account = accounts.find((item) => item._id === transaction.account);
  return account?.type !== 'credit_card' && transaction.status === 'paid';
};

export const matchesFinancialView = (
  transaction: Transaction,
  view: FinancialView,
  accounts: Account[]
): boolean => {
  if (view === 'consumption') return isConsumptionTransaction(transaction);
  if (view === 'cashFlow') return isCashFlowTransaction(transaction, accounts);
  return true;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount / 100);
};

export const formatDate = (date: string): string => {
  // Parse a data e converte para o timezone local (Brasil)
  const parsedDate = parseISO(date);
  // Adiciona o offset do timezone para garantir que a data UTC seja interpretada corretamente
  const localDate = new Date(
    parsedDate.getTime() + parsedDate.getTimezoneOffset() * 60000
  );
  return format(localDate, 'dd/MM/yyyy');
};

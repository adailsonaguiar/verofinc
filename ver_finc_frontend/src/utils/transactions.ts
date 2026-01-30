import { Transaction } from '../types';
import { format } from 'date-fns';
import { startOfMonth, endOfMonth, eachMonthOfInterval, parseISO } from 'date-fns';

export interface MonthlyTransactions {
  month: Date;
  monthLabel: string;
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export const groupTransactionsByMonth = (transactions: Transaction[]): MonthlyTransactions[] => {
  if (transactions.length === 0) return [];

  // Sort transactions by date (newest first)
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Get date range
  const dates = sortedTransactions.map(t => parseISO(t.date));
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

  // Generate all months in range
  const months = eachMonthOfInterval({ start: minDate, end: maxDate }).reverse();

  // Group transactions by month
  return months.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    const monthTransactions = sortedTransactions.filter(transaction => {
      const transactionDate = parseISO(transaction.date);
      return transactionDate >= monthStart && transactionDate <= monthEnd;
    });

    const totalIncome = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      month,
      monthLabel: format(month, 'MMMM yyyy'),
      transactions: monthTransactions,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  });
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount/100);
};

export const formatDate = (date: string): string => {
  // Parse a data e converte para o timezone local (Brasil)
  const parsedDate = parseISO(date);
  // Adiciona o offset do timezone para garantir que a data UTC seja interpretada corretamente
  const localDate = new Date(parsedDate.getTime() + parsedDate.getTimezoneOffset() * 60000);
  return format(localDate, 'dd/MM/yyyy');
};

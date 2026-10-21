import api from './api';
import {
  Transaction,
  TransactionFilters,
  CreateTransactionDto,
  UpdateTransactionDto,
} from '../types';

async function fetchTransactions(
  filters: TransactionFilters = {}
): Promise<Transaction[]> {
  const response = await api.get<Transaction[]>('/transactions', {
    params: filters,
  });
  return response.data;
}

export const transactionService = {
  async getFiltered(filters: TransactionFilters = {}): Promise<Transaction[]> {
    return fetchTransactions(filters);
  },

  async getByMonthAndAccount(
    year: number,
    month: number,
    accountId: string
  ): Promise<Transaction[]> {
    return fetchTransactions({ year, month, account: accountId });
  },

  async getAll(): Promise<Transaction[]> {
    return fetchTransactions();
  },

  async getLastMonths(months: number = 6): Promise<Transaction[]> {
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth() - (months - 1), 1);
    const startDate = start.toISOString().split('T')[0];
    const endDate = new Date(end.getFullYear(), end.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];
    return fetchTransactions({ startDate, endDate });
  },

  async getById(id: string): Promise<Transaction> {
    const response = await api.get<Transaction>(`/transactions/${id}`);
    return response.data;
  },

  async create(data: CreateTransactionDto): Promise<Transaction> {
    const response = await api.post<Transaction>('/transactions', data);
    return response.data;
  },

  async update(id: string, data: UpdateTransactionDto): Promise<Transaction> {
    const response = await api.patch<Transaction>(`/transactions/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/transactions/${id}`);
  },

  async getByType(type: string): Promise<Transaction[]> {
    return fetchTransactions({ type });
  },

  async getByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Transaction[]> {
    return fetchTransactions({ startDate, endDate });
  },

  async getByMonth(year: number, month: number): Promise<Transaction[]> {
    return fetchTransactions({ year, month });
  },

  async getAvailableMonths(): Promise<{ year: number; month: number }[]> {
    const response = await api.get<{ year: number; month: number }[]>(
      '/transactions/available-months'
    );
    return response.data;
  },

  async reorder(ids: string[]): Promise<void> {
    await api.post('/transactions/reorder', { ids });
  },
};

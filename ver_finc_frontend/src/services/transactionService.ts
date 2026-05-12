import api from './api';
import {
  Transaction,
  CreateTransactionDto,
  UpdateTransactionDto,
} from '../types';

export const transactionService = {
  async getByMonthAndAccount(
    year: number,
    month: number,
    accountId: string
  ): Promise<Transaction[]> {
    const response = await api.get<Transaction[]>(
      `/transactions?year=${year}&month=${month}&account=${accountId}`
    );
    return response.data;
  },
  async getAll(): Promise<Transaction[]> {
    const response = await api.get<Transaction[]>('/transactions');
    return response.data;
  },

  async getLastMonths(months: number = 6): Promise<Transaction[]> {
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth() - (months - 1), 1);
    const startDate = start.toISOString().split('T')[0];
    const endDate = new Date(end.getFullYear(), end.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];
    const response = await api.get<Transaction[]>(
      `/transactions?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data;
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
    const response = await api.get<Transaction[]>(`/transactions?type=${type}`);
    return response.data;
  },

  async getByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Transaction[]> {
    const response = await api.get<Transaction[]>(
      `/transactions?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data;
  },

  async getByMonth(year: number, month: number): Promise<Transaction[]> {
    const response = await api.get<Transaction[]>(
      `/transactions?year=${year}&month=${month}`
    );
    return response.data;
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

import api from './api';
import { Account } from '../types';

export const accountService = {
  async getAll(): Promise<Account[]> {
    const res = await api.get<Account[]>('/accounts');
    return res.data;
  },
  async getByType(type: string): Promise<Account[]> {
    const res = await api.get<Account[]>('/accounts', { params: { type } });
    return res.data;
  },
  async create(data: {
    name: string;
    type: string;
    initialBalance?: number;
    creditLimit?: number;
    closingDay?: number;
    dueDay?: number;
  }): Promise<Account> {
    const res = await api.post<Account>('/accounts', data);
    return res.data;
  },
  async update(
    id: string,
    data: {
      name: string;
      initialBalance?: number;
      creditLimit?: number;
      closingDay?: number;
      dueDay?: number;
    }
  ): Promise<Account> {
    const res = await api.patch<Account>(`/accounts/${id}`, data);
    return res.data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/accounts/${id}`);
  },
  async payInvoice(
    creditCardId: string,
    checkingAccountId: string,
    year: number,
    month: number
  ): Promise<void> {
    await api.post('/accounts/pay-invoice', {
      creditCardId,
      checkingAccountId,
      year,
      month,
    });
  },
};

import api from './api';
import { Invoice } from '../types';

export const invoiceService = {
  async listByAccount(accountId: string): Promise<Invoice[]> {
    const res = await api.get<Invoice[]>(`/invoices?account=${accountId}`);
    return res.data;
  },
  async getById(id: string): Promise<Invoice> {
    const res = await api.get<Invoice>(`/invoices/${id}`);
    return res.data;
  },
  async close(id: string): Promise<Invoice> {
    const res = await api.post<Invoice>(`/invoices/${id}/close`);
    return res.data;
  },
};

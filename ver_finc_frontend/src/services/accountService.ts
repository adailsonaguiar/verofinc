import api from './api';

export const accountService = {
  async getAll() {
    const res = await api.get('/accounts');
    return res.data;
  },
  async getByType(type: string) {
    const res = await api.get(`/accounts?type=${type}`);
    return res.data;
  },
  async create(data: { name: string; type: string; initialBalance?: number, creditLimit?: number }) {
    const res = await api.post('/accounts', data);
    return res.data;
  },
  async update(id: string, data: { name: string, initialBalance?: number, creditLimit?: number }) {
    const res = await api.patch(`/accounts/${id}`, data);
    return res.data;
  },
  async delete(id: string) {
    const res = await api.delete(`/accounts/${id}`);
    return res.data;
  },
  async payInvoice(creditCardId: string, checkingAccountId: string) {
    const res = await api.post('/accounts/pay-invoice', {
      creditCardId,
      checkingAccountId
    });
    return res.data;
  },
};

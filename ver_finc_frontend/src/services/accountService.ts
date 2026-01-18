import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || '/api'}/accounts`;

export const accountService = {
  async getAll() {
    const res = await axios.get(API_URL);
    return res.data;
  },
  async getByType(type: string) {
    const res = await axios.get(`${API_URL}?type=${type}`);
    return res.data;
  },
  async create(data: { name: string; type: string; initialBalance?: number, creditLimit?: number }) {
    const res = await axios.post(API_URL, data);
    return res.data;
  },
  async update(id: string, data: { name: string, initialBalance?: number, creditLimit?: number }) {
    const res = await axios.patch(`${API_URL}/${id}`, data);
    return res.data;
  },
  async delete(id: string) {
    const res = await axios.delete(`${API_URL}/${id}`);
    return res.data;
  },
  async payInvoice(creditCardId: string, checkingAccountId: string) {
    const res = await axios.post(`${API_URL}/pay-invoice`, {
      creditCardId,
      checkingAccountId
    });
    return res.data;
  },
};

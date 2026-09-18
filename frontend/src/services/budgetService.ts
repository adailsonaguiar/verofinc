import api from './api';
import { BudgetOverview } from '../types';

export const budgetService = {
  async getOverview(month: string): Promise<BudgetOverview> {
    const response = await api.get<BudgetOverview>(`/budgets?month=${month}`);
    return response.data;
  },

  async upsert(
    month: string,
    categoryId: string | null,
    limit: number
  ): Promise<void> {
    await api.put('/budgets', {
      month,
      categoryId: categoryId ?? undefined,
      limit,
    });
  },

  async remove(month: string, categoryId?: string | null): Promise<void> {
    const params = new URLSearchParams({ month });
    if (categoryId) params.set('categoryId', categoryId);
    await api.delete(`/budgets?${params.toString()}`);
  },
};

import api from './api';
import { Category } from '../types';

export const categoryService = {
  async getAll(): Promise<Category[]> {
    const response = await api.get<Category[]>('/categories');
    return response.data;
  },

  async getActive(): Promise<Category[]> {
    const response = await api.get<Category[]>('/categories?active=true');
    return response.data;
  },

  async getByType(type: string): Promise<Category[]> {
    const response = await api.get<Category[]>(`/categories?type=${type}`);
    return response.data;
  },

  async getById(id: string): Promise<Category> {
    const response = await api.get<Category>(`/categories/${id}`);
    return response.data;
  },

  async create(data: { name: string; description?: string; icon?: string; type: string }): Promise<Category> {
    const response = await api.post<Category>('/categories', data);
    return response.data;
  },

  async update(id: string, data: Partial<Category>): Promise<Category> {
    const response = await api.patch<Category>(`/categories/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
};

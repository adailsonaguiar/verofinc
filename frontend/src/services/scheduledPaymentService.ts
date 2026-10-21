import api from './api';
import {
  CreateScheduledPaymentDto,
  ScheduledPayment,
  ScheduledPaymentStatus,
  UpdateScheduledPaymentDto,
} from '../types';

export interface ScheduledPaymentFilters {
  status?: ScheduledPaymentStatus | 'overdue';
  startDate?: string;
  endDate?: string;
}

export const scheduledPaymentService = {
  async getAll(
    filters: ScheduledPaymentFilters = {}
  ): Promise<ScheduledPayment[]> {
    const response = await api.get<ScheduledPayment[]>('/scheduled-payments', {
      params: filters,
    });
    return response.data;
  },

  async create(
    data: CreateScheduledPaymentDto
  ): Promise<ScheduledPayment> {
    const response = await api.post<ScheduledPayment>(
      '/scheduled-payments',
      data
    );
    return response.data;
  },

  async update(
    id: string,
    data: UpdateScheduledPaymentDto
  ): Promise<ScheduledPayment> {
    const response = await api.patch<ScheduledPayment>(
      `/scheduled-payments/${id}`,
      data
    );
    return response.data;
  },

  async pay(id: string, paidDate?: string): Promise<ScheduledPayment> {
    const response = await api.post<ScheduledPayment>(
      `/scheduled-payments/${id}/pay`,
      paidDate ? { paidDate } : {}
    );
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/scheduled-payments/${id}`);
  },
};

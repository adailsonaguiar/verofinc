import { format, isBefore, isSameDay, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScheduledPayment, ScheduledPaymentStatus } from '../types';

export interface ScheduledPaymentDueState {
  label: string;
  tone: string;
}

export const getScheduledPaymentDueState = (
  payment: Pick<ScheduledPayment, 'status' | 'dueDate'>,
  today: Date = new Date()
): ScheduledPaymentDueState => {
  const due = startOfDay(parseISO(payment.dueDate));
  const now = startOfDay(today);

  if (payment.status === ScheduledPaymentStatus.PAID) {
    return { label: 'Pago', tone: 'text-emerald-400 bg-emerald-400/10' };
  }
  if (isBefore(due, now)) {
    return { label: 'Vencido', tone: 'text-[#e58b6a] bg-[#ca7251]/10' };
  }
  if (isSameDay(due, now)) {
    return { label: 'Vence hoje', tone: 'text-gold-400 bg-gold-400/10' };
  }
  return {
    label: format(due, 'dd \'de\' MMM', { locale: ptBR }),
    tone: 'text-navy-700 bg-navy-100',
  };
};

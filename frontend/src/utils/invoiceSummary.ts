import type { Invoice } from '../types';

type InvoiceBalance = Pick<Invoice, 'status' | 'totalAmount' | 'paidAmount'>;

export function getInvoiceSummary(
  invoice: InvoiceBalance | undefined,
  expensesInCents: number,
  paymentsInCents: number
): { paid: boolean; total: number; amount: number } {
  return {
    paid: invoice?.status === 'paid',
    total: invoice?.totalAmount ?? expensesInCents,
    amount: invoice
      ? invoice.totalAmount - invoice.paidAmount
      : expensesInCents - paymentsInCents,
  };
}

import type { Invoice } from '../types';

type InvoiceBalance = Pick<Invoice, 'status' | 'totalAmount' | 'paidAmount'>;

export function getInvoiceSummary(
  invoice: InvoiceBalance | undefined,
  expensesInCents: number,
  paymentsInCents: number,
  hasInvoiceTransactions = false
): { paid: boolean; total: number; amount: number } {
  // A settled/partially paid invoice is a snapshot; an open invoice follows its purchases.
  const liveTotal =
    hasInvoiceTransactions &&
    invoice?.paidAmount === 0 &&
    (invoice.status === 'open' || invoice.status === 'overdue');
  const total = liveTotal
    ? expensesInCents
    : invoice?.totalAmount ?? expensesInCents;
  return {
    paid: invoice?.status === 'paid',
    total,
    amount: invoice
      ? total - invoice.paidAmount
      : expensesInCents - paymentsInCents,
  };
}

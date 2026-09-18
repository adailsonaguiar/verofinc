import { describe, it, expect } from 'vitest';
import {
  computeInvoicePeriod,
  resolveInvoiceStatus,
} from './invoice-period.util';
import { InvoiceStatus } from '../../entities/invoice.entity';

describe('computeInvoicePeriod', () => {
  // Card closing day 10, due day 17 (like the invoices.md example)
  it('assigns a purchase before the closing day to the same-month invoice', () => {
    const period = computeInvoicePeriod(10, 17, new Date(2026, 8, 5));

    expect(period.referenceMonth).toBe('2026-09');
    expect(period.closingDate.getFullYear()).toBe(2026);
    expect(period.closingDate.getMonth()).toBe(8);
    expect(period.closingDate.getDate()).toBe(10);
    expect(period.dueDate.getDate()).toBe(17);
    expect(period.dueDate.getMonth()).toBe(8);
    // startDate = day after previous closing (11/08)
    expect(period.startDate.getFullYear()).toBe(2026);
    expect(period.startDate.getMonth()).toBe(7);
    expect(period.startDate.getDate()).toBe(11);
  });

  it('includes a purchase made exactly on the closing day in the current invoice', () => {
    const period = computeInvoicePeriod(10, 17, new Date(2026, 8, 10));

    expect(period.referenceMonth).toBe('2026-09');
    expect(period.closingDate.getDate()).toBe(10);
  });

  it('assigns a purchase after the closing day to the next-month invoice', () => {
    const period = computeInvoicePeriod(10, 17, new Date(2026, 8, 11));

    expect(period.referenceMonth).toBe('2026-10');
    expect(period.closingDate.getMonth()).toBe(9);
    expect(period.closingDate.getDate()).toBe(10);
    // startDate = day after September closing = 11/09
    expect(period.startDate.getMonth()).toBe(8);
    expect(period.startDate.getDate()).toBe(11);
  });

  it('handles year rollover (purchase in December after closing)', () => {
    const period = computeInvoicePeriod(10, 17, new Date(2026, 11, 12));

    expect(period.referenceMonth).toBe('2027-01');
    expect(period.closingDate.getFullYear()).toBe(2027);
    expect(period.closingDate.getMonth()).toBe(0);
    expect(period.closingDate.getDate()).toBe(10);
    // startDate = day after December closing (10/12) => 11/12
    expect(period.startDate.getFullYear()).toBe(2026);
    expect(period.startDate.getMonth()).toBe(11);
    expect(period.startDate.getDate()).toBe(11);
  });

  it('clamps the closing day to the last day of shorter months', () => {
    // closingDay 31, purchase in February (non-leap) belongs to February invoice
    const period = computeInvoicePeriod(31, 10, new Date(2026, 1, 15));

    expect(period.referenceMonth).toBe('2026-02');
    expect(period.closingDate.getMonth()).toBe(1);
    expect(period.closingDate.getDate()).toBe(28);
  });

  it('treats a closingDay of 31 as end-of-month for a 31-day month', () => {
    const period = computeInvoicePeriod(31, 10, new Date(2026, 0, 31));

    expect(period.referenceMonth).toBe('2026-01');
    expect(period.closingDate.getDate()).toBe(31);
  });

  it('computes a continuous startDate right after the previous closing', () => {
    const period = computeInvoicePeriod(10, 17, new Date(2026, 2, 3));

    expect(period.referenceMonth).toBe('2026-03');
    // previous closing = 10/02, so startDate = 11/02
    expect(period.startDate.getMonth()).toBe(1);
    expect(period.startDate.getDate()).toBe(11);
  });

  it('places the due date in the following month when dueDay <= closingDay', () => {
    // Card closes on the 30th and is due on the 6th (e.g. Unique card)
    const period = computeInvoicePeriod(30, 6, new Date(2026, 8, 5));

    expect(period.referenceMonth).toBe('2026-09');
    expect(period.closingDate.getDate()).toBe(30);
    // due date = 06/10
    expect(period.dueDate.getFullYear()).toBe(2026);
    expect(period.dueDate.getMonth()).toBe(9);
    expect(period.dueDate.getDate()).toBe(6);
  });

  it('places the due date in the same month when dueDay > closingDay', () => {
    const period = computeInvoicePeriod(10, 17, new Date(2026, 8, 5));

    expect(period.dueDate.getMonth()).toBe(8);
    expect(period.dueDate.getDate()).toBe(17);
  });
});

describe('resolveInvoiceStatus', () => {
  const pastDue = new Date('2026-01-10T00:00:00');
  const now = new Date('2026-03-01T00:00:00');
  const futureDue = new Date('2026-05-10T00:00:00');

  it('keeps PAID status regardless of due date', () => {
    expect(
      resolveInvoiceStatus({ status: InvoiceStatus.PAID, dueDate: pastDue }, now)
    ).toBe(InvoiceStatus.PAID);
  });

  it('marks an unpaid invoice as overdue when past due date', () => {
    expect(
      resolveInvoiceStatus({ status: InvoiceStatus.OPEN, dueDate: pastDue }, now)
    ).toBe(InvoiceStatus.OVERDUE);
  });

  it('keeps OPEN when not yet due', () => {
    expect(
      resolveInvoiceStatus({ status: InvoiceStatus.OPEN, dueDate: futureDue }, now)
    ).toBe(InvoiceStatus.OPEN);
  });

  it('keeps CLOSED when not yet due', () => {
    expect(
      resolveInvoiceStatus(
        { status: InvoiceStatus.CLOSED, dueDate: futureDue },
        now
      )
    ).toBe(InvoiceStatus.CLOSED);
  });
});

import { InvoiceStatus } from '../../entities/invoice.entity';

export interface InvoicePeriod {
  referenceMonth: string;
  startDate: Date;
  closingDate: Date;
  dueDate: Date;
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function clampDay(day: number, year: number, monthIndex: number): number {
  return Math.min(day, daysInMonth(year, monthIndex));
}

/**
 * Determines the invoice period a transaction date belongs to, based on the
 * credit card closing day and due day.
 *
 * Rule (inclusive closing day): a purchase is assigned to the invoice whose
 * `closingDate` happens in the same month when `day <= closingDay`, otherwise
 * to the invoice that closes in the following month. The `startDate` is the day
 * after the previous closing, and `referenceMonth` reflects the closing month.
 */
export function computeInvoicePeriod(
  closingDay: number,
  dueDay: number,
  date: Date
): InvoicePeriod {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  let closingYear = year;
  let closingMonth = month;

  if (day > closingDay) {
    closingMonth += 1;
    if (closingMonth > 11) {
      closingMonth = 0;
      closingYear += 1;
    }
  }

  const effectiveClosingDay = clampDay(closingDay, closingYear, closingMonth);
  const closingDate = new Date(
    closingYear,
    closingMonth,
    effectiveClosingDay
  );

  const prevClosingMonth = closingMonth - 1;
  const prevClosingYear =
    prevClosingMonth < 0 ? closingYear - 1 : closingYear;
  const prevClosingMonthIndex = prevClosingMonth < 0 ? 11 : prevClosingMonth;
  const prevClosingDay = clampDay(
    closingDay,
    prevClosingYear,
    prevClosingMonthIndex
  );
  const prevClosing = new Date(
    prevClosingYear,
    prevClosingMonthIndex,
    prevClosingDay
  );
  const startDate = new Date(
    prevClosing.getFullYear(),
    prevClosing.getMonth(),
    prevClosing.getDate() + 1
  );

  // When the due day is on or before the closing day, the invoice is due in
  // the following month (e.g. closes on the 30th, due on the 6th).
  const dueIsNextMonth = dueDay <= effectiveClosingDay;
  const dueMonth = dueIsNextMonth ? closingMonth + 1 : closingMonth;
  const dueYear = dueMonth > 11 ? closingYear + 1 : closingYear;
  const dueMonthIndex = dueMonth > 11 ? 0 : dueMonth;
  const effectiveDueDay = clampDay(dueDay, dueYear, dueMonthIndex);
  const dueDate = new Date(dueYear, dueMonthIndex, effectiveDueDay);

  const referenceMonth = `${closingYear}-${String(closingMonth + 1).padStart(
    2,
    '0'
  )}`;

  return { referenceMonth, startDate, closingDate, dueDate };
}

export function resolveInvoiceStatus(
  invoice: { status: InvoiceStatus; dueDate?: Date },
  now: Date = new Date()
): InvoiceStatus {
  if (invoice.status === InvoiceStatus.PAID) return InvoiceStatus.PAID;
  if (invoice.dueDate && now > invoice.dueDate) return InvoiceStatus.OVERDUE;
  return invoice.status;
}

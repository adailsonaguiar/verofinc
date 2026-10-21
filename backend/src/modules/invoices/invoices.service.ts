import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InvoiceRepository } from '../../repositories/invoice.repository';
import { AccountRepository } from '../../repositories/account.repository';
import { TransactionRepository } from '../../repositories/transaction.repository';
import {
  Invoice,
  InvoiceDocument,
  InvoiceStatus,
} from '../../entities/invoice.entity';
import { Transaction } from '../../entities/transaction.entity';
import { AccountType } from '../../entities/account.entity';
import {
  InvoicePeriod,
  computeInvoicePeriod,
  resolveInvoiceStatus,
} from './invoice-period.util';

const DEFAULT_CLOSING_DAY = 31;
const DEFAULT_DUE_DAY = 7;

@Injectable()
export class InvoicesService {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly accountRepository: AccountRepository,
    private readonly transactionRepository: TransactionRepository,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>
  ) {}

  /**
   * Finds or creates the invoice a transaction date belongs to. Returns null
   * only for non-credit-card accounts. Cards without a closing day fall back
   * to an end-of-month closing so an invoice is always created.
   */
  async getOrCreateInvoice(
    account: {
      _id?: Types.ObjectId | string;
      type?: string;
      closingDay?: number;
      dueDay?: number;
    },
    date: Date
  ): Promise<InvoiceDocument | null> {
    if (account.type !== AccountType.CREDIT_CARD) {
      return null;
    }

    const closingDay = account.closingDay ?? DEFAULT_CLOSING_DAY;
    const dueDay = account.dueDay ?? DEFAULT_DUE_DAY;
    const period = computeInvoicePeriod(closingDay, dueDay, date);
    const accountId = (account as any)._id.toString();

    const existing =
      await this.invoiceRepository.findByAccountAndReferenceMonth(
        accountId,
        period.referenceMonth
      );
    if (existing) return existing;

    try {
      return await this.invoiceRepository.create({
        account: new Types.ObjectId(accountId),
        referenceMonth: period.referenceMonth,
        startDate: period.startDate,
        closingDate: period.closingDate,
        dueDate: period.dueDate,
        status: InvoiceStatus.OPEN,
        totalAmount: 0,
        paidAmount: 0,
      });
    } catch (error) {
      // Unique index on (account, referenceMonth): another concurrent call may have created it.
      if ((error as any)?.code === 11000) {
        const concurrent =
          await this.invoiceRepository.findByAccountAndReferenceMonth(
            accountId,
            period.referenceMonth
          );
        if (concurrent) return concurrent;
      }
      throw error;
    }
  }

  async incrementTotal(
    invoiceId: Types.ObjectId | string,
    amount: number
  ): Promise<InvoiceDocument | null> {
    return this.invoiceRepository.incrementTotal(invoiceId.toString(), amount);
  }

  async decrementTotal(
    invoiceId: Types.ObjectId | string,
    amount: number
  ): Promise<InvoiceDocument | null> {
    return this.invoiceRepository.decrementTotal(invoiceId.toString(), amount);
  }

  async listByAccount(accountId: string): Promise<Invoice[]> {
    const account = await this.accountRepository.findById(accountId);
    let invoices = await this.invoiceRepository.findByAccount(accountId);

    if (account?.type === AccountType.CREDIT_CARD) {
      const closingDay = account.closingDay ?? DEFAULT_CLOSING_DAY;
      const dueDay = account.dueDay ?? DEFAULT_DUE_DAY;
      const needsReconciliation = invoices.some(
        (invoice) =>
          !this.isProtectedInvoice(invoice) &&
          !this.matchesExpectedPeriod(invoice, closingDay, dueDay)
      );

      if (needsReconciliation) {
        await this.reconcileAccountInvoices(account);
        invoices = await this.invoiceRepository.findByAccount(accountId);
      }
    }

    return invoices.map((invoice) => ({
      ...(invoice as any)._doc,
      status: resolveInvoiceStatus(invoice),
    }));
  }

  /**
   * Rebuilds the period, transaction links and totals of every invoice that is
   * not a closed/paid financial snapshot. This is used when the card's closing
   * or due day changes, including to repair invoices created with an older
   * configuration.
   */
  async reconcileAccountInvoices(account: {
    _id?: Types.ObjectId | string;
    type?: string;
    closingDay?: number;
    dueDay?: number;
  }): Promise<void> {
    if (account.type !== AccountType.CREDIT_CARD || !account._id) return;

    const accountId = account._id.toString();
    const closingDay = account.closingDay ?? DEFAULT_CLOSING_DAY;
    const dueDay = account.dueDay ?? DEFAULT_DUE_DAY;

    const invoices = await this.invoiceRepository.findByAccount(accountId);
    const invoiceById = new Map(
      invoices.map((invoice) => [invoice._id.toString(), invoice])
    );
    const invoiceByReference = new Map(
      invoices.map((invoice) => [invoice.referenceMonth, invoice])
    );
    const protectedInvoiceIds = new Set(
      invoices
        .filter((invoice) => this.isProtectedInvoice(invoice))
        .map((invoice) => invoice._id.toString())
    );

    const transactions =
      await this.transactionRepository.findExpensesForInvoiceReconciliation(
        accountId,
        Array.from(protectedInvoiceIds)
      );

    const targetPeriods = new Map<string, InvoicePeriod>();
    const transactionsByReference = new Map<
      string,
      { period: InvoicePeriod; transactionIds: string[] }
    >();
    const finalInvoiceByTransaction = new Map<string, string>();

    for (const transaction of transactions) {
      const transactionId = (transaction as any)._id.toString();
      const currentInvoiceId = transaction.invoice
        ? transaction.invoice.toString()
        : null;
      const period = computeInvoicePeriod(
        closingDay,
        dueDay,
        new Date(transaction.date)
      );
      const targetInvoice = invoiceByReference.get(period.referenceMonth);

      // A configuration change must not rewrite an invoice that was already
      // paid/closed. Keep the transaction in its current invoice.
      if (
        targetInvoice &&
        protectedInvoiceIds.has(targetInvoice._id.toString())
      ) {
        if (currentInvoiceId) {
          finalInvoiceByTransaction.set(transactionId, currentInvoiceId);
        }
        continue;
      }

      const group = transactionsByReference.get(period.referenceMonth) ?? {
        period,
        transactionIds: [],
      };
      group.transactionIds.push(transactionId);
      transactionsByReference.set(period.referenceMonth, group);
    }

    for (const [referenceMonth, group] of transactionsByReference) {
      let invoice = invoiceByReference.get(referenceMonth);

      if (!invoice) {
        try {
          invoice = await this.invoiceRepository.create({
            account: new Types.ObjectId(accountId),
            referenceMonth,
            startDate: group.period.startDate,
            closingDate: group.period.closingDate,
            dueDate: group.period.dueDate,
            status: InvoiceStatus.OPEN,
            totalAmount: 0,
            paidAmount: 0,
          });
        } catch (error) {
          if ((error as any)?.code !== 11000) throw error;
          invoice = await this.invoiceRepository.findByAccountAndReferenceMonth(
            accountId,
            referenceMonth
          );
        }
        if (!invoice) continue;
        invoiceByReference.set(referenceMonth, invoice);
        invoiceById.set(invoice._id.toString(), invoice);
      } else {
        const updated = await this.invoiceRepository.update(
          invoice._id.toString(),
          {
            startDate: group.period.startDate,
            closingDate: group.period.closingDate,
            dueDate: group.period.dueDate,
          }
        );
        if (updated) {
          invoiceById.set(invoice._id.toString(), updated);
        }
      }

      targetPeriods.set(invoice._id.toString(), group.period);
      for (const transactionId of group.transactionIds) {
        finalInvoiceByTransaction.set(transactionId, invoice._id.toString());
      }
    }

    const transactionById = new Map(
      transactions.map((transaction) => [
        (transaction as any)._id.toString(),
        transaction,
      ])
    );
    const totalsByInvoice = new Map<string, number>();
    const linkedInvoiceIds = new Set<string>();

    for (const [transactionId, invoiceId] of finalInvoiceByTransaction) {
      const transaction = transactionById.get(transactionId);
      if (!transaction) continue;
      linkedInvoiceIds.add(invoiceId);
      totalsByInvoice.set(
        invoiceId,
        (totalsByInvoice.get(invoiceId) ?? 0) + transaction.amount
      );
    }

    const assignments = Array.from(finalInvoiceByTransaction.entries())
      .filter(([transactionId, invoiceId]) => {
        const transaction = transactionById.get(transactionId);
        return transaction?.invoice?.toString() !== invoiceId;
      })
      .map(([transactionId, invoiceId]) => ({ transactionId, invoiceId }));

    await this.transactionRepository.setInvoicesForTransactions(assignments);

    for (const invoice of invoiceById.values()) {
      const invoiceId = invoice._id.toString();
      if (protectedInvoiceIds.has(invoiceId)) continue;

      if (!linkedInvoiceIds.has(invoiceId)) {
        await this.invoiceRepository.delete(invoiceId);
        continue;
      }

      const period =
        targetPeriods.get(invoiceId) ??
        this.periodForReference(invoice.referenceMonth, closingDay, dueDay);

      await this.invoiceRepository.update(invoiceId, {
        totalAmount: totalsByInvoice.get(invoiceId) ?? 0,
        ...(period
          ? {
              startDate: period.startDate,
              closingDate: period.closingDate,
              dueDate: period.dueDate,
            }
          : {}),
      });
    }
  }

  private isProtectedInvoice(invoice: {
    status?: InvoiceStatus;
    paidAmount?: number;
  }): boolean {
    return (
      invoice.paidAmount > 0 ||
      invoice.status === InvoiceStatus.PAID ||
      invoice.status === InvoiceStatus.CLOSED ||
      invoice.status === InvoiceStatus.PARTIALLY_PAID
    );
  }

  private matchesExpectedPeriod(
    invoice: Invoice,
    closingDay: number,
    dueDay: number
  ): boolean {
    const expected = this.periodForReference(
      invoice.referenceMonth,
      closingDay,
      dueDay
    );
    if (!expected) return true;

    return (
      this.isSameDay(invoice.startDate, expected.startDate) &&
      this.isSameDay(invoice.closingDate, expected.closingDate) &&
      this.isSameDay(invoice.dueDate, expected.dueDate)
    );
  }

  private periodForReference(
    referenceMonth: string,
    closingDay: number,
    dueDay: number
  ): InvoicePeriod | null {
    const [year, month] = referenceMonth.split('-').map(Number);
    if (!year || !month) return null;

    return computeInvoicePeriod(
      closingDay,
      dueDay,
      new Date(year, month - 1, 1)
    );
  }

  private isSameDay(left: Date, right: Date): boolean {
    const leftDate = new Date(left);
    const rightDate = new Date(right);
    return (
      leftDate.getFullYear() === rightDate.getFullYear() &&
      leftDate.getMonth() === rightDate.getMonth() &&
      leftDate.getDate() === rightDate.getDate()
    );
  }

  async findById(
    id: string
  ): Promise<Invoice & { transactions: Transaction[] }> {
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    const transactions = await this.transactionModel
      .find({ invoice: invoice._id })
      .populate('category')
      .sort({ date: -1 })
      .exec();

    return {
      ...(invoice as any)._doc,
      status: resolveInvoiceStatus(invoice),
      transactions,
    };
  }

  async close(id: string): Promise<InvoiceDocument> {
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    if (invoice.status === InvoiceStatus.CLOSED) return invoice;

    const updated = await this.invoiceRepository.update(id, {
      status: InvoiceStatus.CLOSED,
      closedAt: new Date(),
    });
    if (!updated) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    return updated;
  }

  async markPaidByReferenceMonth(
    accountId: string,
    referenceMonth: string,
    amountInCents?: number
  ): Promise<InvoiceDocument | null> {
    const invoice = await this.invoiceRepository.findByAccountAndReferenceMonth(
      accountId,
      referenceMonth
    );
    if (!invoice) return null;

    const paidAmount =
      amountInCents !== undefined ? amountInCents : invoice.totalAmount;

    return this.invoiceRepository.update(invoice._id.toString(), {
      status: InvoiceStatus.PAID,
      totalAmount: paidAmount,
      paidAmount,
      paidAt: new Date(),
    });
  }
}

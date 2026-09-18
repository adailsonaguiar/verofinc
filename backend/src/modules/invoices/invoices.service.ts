import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InvoiceRepository } from '../../repositories/invoice.repository';
import {
  Invoice,
  InvoiceDocument,
  InvoiceStatus,
} from '../../entities/invoice.entity';
import { Transaction } from '../../entities/transaction.entity';
import { AccountType } from '../../entities/account.entity';
import {
  computeInvoicePeriod,
  resolveInvoiceStatus,
} from './invoice-period.util';

const DEFAULT_CLOSING_DAY = 31;
const DEFAULT_DUE_DAY = 7;

@Injectable()
export class InvoicesService {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
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
    const invoices = await this.invoiceRepository.findByAccount(accountId);
    return invoices.map((invoice) => ({
      ...(invoice as any)._doc,
      status: resolveInvoiceStatus(invoice),
    }));
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
    const invoice =
      await this.invoiceRepository.findByAccountAndReferenceMonth(
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

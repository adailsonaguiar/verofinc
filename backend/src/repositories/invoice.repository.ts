import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invoice, InvoiceDocument } from '../entities/invoice.entity';

@Injectable()
export class InvoiceRepository {
  constructor(
    @InjectModel(Invoice.name)
    private invoiceModel: Model<InvoiceDocument>
  ) {}

  async create(invoice: Partial<Invoice>): Promise<InvoiceDocument> {
    const created = new this.invoiceModel(invoice);
    return created.save();
  }

  async findById(id: string): Promise<InvoiceDocument | null> {
    return this.invoiceModel.findById(id).exec();
  }

  async findByAccount(accountId: string): Promise<InvoiceDocument[]> {
    return this.invoiceModel
      .find({ account: accountId })
      .sort({ closingDate: -1 })
      .exec();
  }

  async findByAccountAndReferenceMonth(
    accountId: string,
    referenceMonth: string
  ): Promise<InvoiceDocument | null> {
    return this.invoiceModel
      .findOne({ account: accountId, referenceMonth })
      .exec();
  }

  async update(
    id: string,
    invoice: Partial<Invoice>
  ): Promise<InvoiceDocument | null> {
    return this.invoiceModel
      .findByIdAndUpdate(id, invoice, { new: true })
      .exec();
  }

  async incrementTotal(
    id: string,
    amount: number
  ): Promise<InvoiceDocument | null> {
    return this.invoiceModel
      .findByIdAndUpdate(id, { $inc: { totalAmount: amount } }, { new: true })
      .exec();
  }

  async decrementTotal(
    id: string,
    amount: number
  ): Promise<InvoiceDocument | null> {
    return this.invoiceModel
      .findByIdAndUpdate(id, { $inc: { totalAmount: -amount } }, { new: true })
      .exec();
  }
}

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type InvoiceDocument = Invoice & Document;

export enum InvoiceStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  OVERDUE = 'overdue',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
}

@Schema({ timestamps: true })
export class Invoice {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Account',
    required: true,
  })
  account: Types.ObjectId;

  @Prop({ required: true })
  referenceMonth: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  closingDate: Date;

  @Prop({ required: true })
  dueDate: Date;

  @Prop({ type: Number, default: 0 })
  totalAmount: number;

  @Prop({ type: Number, default: 0 })
  paidAmount: number;

  @Prop({
    type: String,
    enum: InvoiceStatus,
    default: InvoiceStatus.OPEN,
  })
  status: InvoiceStatus;

  @Prop()
  closedAt?: Date;

  @Prop()
  paidAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

InvoiceSchema.index(
  { account: 1, startDate: 1, closingDate: 1 },
  { name: 'invoice_period_idx' }
);

InvoiceSchema.index(
  { account: 1, referenceMonth: 1 },
  {
    unique: true,
    name: 'invoice_account_reference_unique',
    partialFilterExpression: { referenceMonth: { $exists: true } },
  }
);

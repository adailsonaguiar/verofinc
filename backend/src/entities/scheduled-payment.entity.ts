import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TransactionType } from './transaction.entity';

export type ScheduledPaymentDocument = ScheduledPayment & Document;

export enum ScheduledPaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export enum RecurrenceFrequency {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export interface ScheduledPaymentRecurrence {
  frequency: RecurrenceFrequency;
  interval: number;
  endDate?: Date;
  anchorDate: Date;
}

@Schema({ timestamps: true })
export class ScheduledPayment {
  @Prop({ required: true, trim: true })
  description: string;

  /** Monetary values are persisted in cents. */
  @Prop({ required: true, min: 1 })
  amount: number;

  @Prop({ required: true, index: true })
  dueDate: Date;

  @Prop({ type: String, required: true, enum: TransactionType })
  type: TransactionType;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  account: Types.ObjectId;

  @Prop({
    type: String,
    enum: ScheduledPaymentStatus,
    default: ScheduledPaymentStatus.PENDING,
    index: true,
  })
  status: ScheduledPaymentStatus;

  @Prop({ type: Object, required: false })
  recurrence?: ScheduledPaymentRecurrence;

  @Prop({ type: Types.ObjectId, required: false, index: true })
  seriesId?: Types.ObjectId;

  @Prop({ default: 1, min: 1 })
  occurrenceNumber: number;

  @Prop({ type: Types.ObjectId, ref: 'Transaction', required: false })
  transaction?: Types.ObjectId;

  @Prop({ required: false })
  paidAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const ScheduledPaymentSchema =
  SchemaFactory.createForClass(ScheduledPayment);

ScheduledPaymentSchema.index({ status: 1, dueDate: 1 });
ScheduledPaymentSchema.index(
  { seriesId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      seriesId: { $exists: true },
      status: ScheduledPaymentStatus.PENDING,
    },
  }
);

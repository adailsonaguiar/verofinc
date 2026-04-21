import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum LedgerOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  REVERSAL = 'reversal',
}

@Schema({ timestamps: true })
export class Ledger extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Transaction' })
  transactionId?: Types.ObjectId;

  @Prop({ required: true, enum: LedgerOperationType })
  operationType: LedgerOperationType;

  @Prop()
  description: string;

  @Prop({ type: Date, default: Date.now })
  operationDate: Date;

  @Prop({ required: true })
  value: number;

  @Prop({ type: Types.ObjectId, ref: 'Account' })
  accountId: Types.ObjectId;
}

export const LedgerSchema = SchemaFactory.createForClass(Ledger);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AccountDocument = Account & Document;

export enum AccountType {
  CHECKING = 'checking',
  CREDIT_CARD = 'credit_card',
}

@Schema({ timestamps: true })
export class Account {
  @Prop({ required: true })
  name: string;

  @Prop({ type: String, required: true, enum: AccountType })
  type: AccountType;

  @Prop({ default: true })
  active: boolean;

  @Prop({ type: Number, default: 0 })
  initialBalance: number;

  @Prop({ type: Number, default: 0 })
  creditLimit: number;
}

export const AccountSchema = SchemaFactory.createForClass(Account);

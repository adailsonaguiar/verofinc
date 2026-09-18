import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BudgetDocument = Budget & Document;

@Schema({ timestamps: true })
export class Budget {
  @Prop({ required: true })
  month: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', default: null })
  category: Types.ObjectId | null;

  @Prop({ required: true })
  limit: number;

  createdAt: Date;
  updatedAt: Date;
}

export const BudgetSchema = SchemaFactory.createForClass(Budget);

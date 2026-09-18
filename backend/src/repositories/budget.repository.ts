import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Budget, BudgetDocument } from '../entities/budget.entity';

@Injectable()
export class BudgetRepository {
  constructor(
    @InjectModel(Budget.name)
    private budgetModel: Model<BudgetDocument>
  ) {}

  async upsert(
    month: string,
    category: Types.ObjectId | null,
    limit: number
  ): Promise<BudgetDocument> {
    return this.budgetModel
      .findOneAndUpdate(
        { month, category },
        { $set: { limit }, $setOnInsert: { month, category } },
        { new: true, upsert: true }
      )
      .exec();
  }

  async findByMonth(month: string): Promise<BudgetDocument[]> {
    return this.budgetModel.find({ month }).exec();
  }

  async remove(
    month: string,
    category: Types.ObjectId | null
  ): Promise<BudgetDocument | null> {
    return this.budgetModel.findOneAndDelete({ month, category }).exec();
  }
}

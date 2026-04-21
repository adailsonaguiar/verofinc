import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  Transaction,
  TransactionDocument,
} from "../entities/transaction.entity";

@Injectable()
export class TransactionRepository {
  async findWithFilters(filters: any): Promise<Transaction[]> {
    const query: any = {};
    if (filters.type) query.type = filters.type;
    if (filters.category) {
      // Aceita tanto string quanto ObjectId
      try {
        const { Types } = require("mongoose");
        query.category = Types.ObjectId.isValid(filters.category)
          ? filters.category
          : undefined;
      } catch {
        query.category = filters.category;
      }
    }
    if (filters.account) query.account = filters.account;
    if (filters.status) query.status = filters.status;
    if (filters.description)
      query.description = { $regex: filters.description, $options: "i" };
    if (filters.year && filters.month) {
      const startDate = new Date(
        Date.UTC(filters.year, filters.month - 1, 1, 0, 0, 0, 0),
      );
      const endDate = new Date(
        Date.UTC(filters.year, filters.month, 0, 23, 59, 59, 999),
      );
      query.date = { $gte: startDate, $lte: endDate };
    }
    if (filters.startDate && filters.endDate) {
      query.date = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate),
      };
    }
    return this.transactionModel
      .find(query)
      .populate("category")
      .sort({ date: -1 })
      .exec();
  }

  async findByDescription(description: string): Promise<Transaction[]> {
    // Busca por descrição (case-insensitive, parcial)
    return this.transactionModel
      .find({ description: { $regex: description, $options: "i" } })
      .populate("category")
      .exec();
  }

  async findByAccount(accountId: string): Promise<Transaction[]> {
    return this.transactionModel
      .find({ account: accountId })
      .populate("category")
      .exec();
  }

  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
  ) {}

  async create(transaction: Partial<Transaction>): Promise<Transaction> {
    const createdTransaction = new this.transactionModel(transaction);
    return createdTransaction.save();
  }

  async findAll(filter: any = {}): Promise<Transaction[]> {
    return this.transactionModel.find(filter).populate("category").exec();
  }

  async findById(id: string): Promise<Transaction> {
    return this.transactionModel.findById(id).populate("category").exec();
  }

  async update(
    id: string,
    transaction: Partial<Transaction>,
  ): Promise<Transaction> {
    return this.transactionModel
      .findByIdAndUpdate(id, transaction, { new: true })
      .exec();
  }

  async delete(id: string): Promise<Transaction> {
    return this.transactionModel.findByIdAndDelete(id).exec();
  }

  async findByType(type: string): Promise<Transaction[]> {
    return this.transactionModel.find({ type }).exec();
  }

  async findByCategory(category: string): Promise<Transaction[]> {
    return this.transactionModel.find({ category }).exec();
  }

  async findByStatus(status: string): Promise<Transaction[]> {
    return this.transactionModel.find({ status }).exec();
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<Transaction[]> {
    return this.transactionModel
      .find({
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .populate("category")
      .exec();
  }

  async findByMonth(year: number, month: number): Promise<Transaction[]> {
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    return this.transactionModel
      .find({
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .populate("category")
      .sort({ date: -1 })
      .exec();
  }

  async getAvailableMonths(): Promise<{ year: number; month: number }[]> {
    const transactions = await this.transactionModel
      .find()
      .select("date")
      .sort({ date: -1 })
      .exec();

    const monthsSet = new Set<string>();

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      monthsSet.add(key);
    });

    return Array.from(monthsSet)
      .map((key) => {
        const [year, month] = key.split("-").map(Number);
        return { year, month };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
  }
}

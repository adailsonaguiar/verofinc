import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ledger } from '../entities/ledger.entity';

@Injectable()
export class LedgerRepository {
  constructor(@InjectModel(Ledger.name) private ledgerModel: Model<Ledger>) {}

  async create(ledger: Partial<Ledger>): Promise<Ledger> {
    const newLedger = new this.ledgerModel(ledger);
    return newLedger.save();
  }

  async findAll(): Promise<Ledger[]> {
    return this.ledgerModel
      .find()
      .populate('transactionId')
      .populate('reversalTransactionId')
      .sort({ operationDate: -1 })
      .exec();
  }

  async findById(id: string): Promise<Ledger> {
    return this.ledgerModel
      .findById(id)
      .populate('transactionId')
      .populate('reversalTransactionId')
      .exec();
  }

  async findByTransactionId(transactionId: string): Promise<Ledger[]> {
    return this.ledgerModel
      .find({ transactionId })
      .populate('transactionId')
      .populate('reversalTransactionId')
      .sort({ operationDate: -1 })
      .exec();
  }

  async findByOperationType(operationType: string): Promise<Ledger[]> {
    return this.ledgerModel
      .find({ operationType })
      .populate('transactionId')
      .populate('reversalTransactionId')
      .sort({ operationDate: -1 })
      .exec();
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Ledger[]> {
    return this.ledgerModel
      .find({
        operationDate: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .populate('transactionId')
      .populate('reversalTransactionId')
      .sort({ operationDate: -1 })
      .exec();
  }
}

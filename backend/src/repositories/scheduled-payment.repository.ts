import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import {
  ScheduledPayment,
  ScheduledPaymentDocument,
  ScheduledPaymentStatus,
} from '../entities/scheduled-payment.entity';

export interface ScheduledPaymentFilters {
  status?: ScheduledPaymentStatus | 'overdue';
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class ScheduledPaymentRepository {
  constructor(
    @InjectModel(ScheduledPayment.name)
    private readonly model: Model<ScheduledPaymentDocument>
  ) {}

  async create(payment: Partial<ScheduledPayment>): Promise<ScheduledPayment> {
    const created = new this.model(payment);
    return created.save();
  }

  async findAll(
    filters: ScheduledPaymentFilters = {}
  ): Promise<ScheduledPayment[]> {
    const query: FilterQuery<ScheduledPaymentDocument> = {};
    const dueDate: Record<string, Date> = {};

    if (filters.status === 'overdue') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.status = ScheduledPaymentStatus.PENDING;
      dueDate.$lt = today;
    } else if (filters.status) {
      query.status = filters.status;
    }

    if (filters.startDate) dueDate.$gte = filters.startDate;
    if (filters.endDate) dueDate.$lte = filters.endDate;
    if (Object.keys(dueDate).length > 0) query.dueDate = dueDate;

    return this.model
      .find(query)
      .populate('category')
      .populate('account')
      .sort({ dueDate: 1, createdAt: 1 })
      .exec();
  }

  async findById(id: string): Promise<ScheduledPayment> {
    return this.model
      .findById(id)
      .populate('category')
      .populate('account')
      .exec();
  }

  async update(
    id: string,
    data: Partial<ScheduledPayment>
  ): Promise<ScheduledPayment> {
    return this.model
      .findByIdAndUpdate(id, data, { new: true })
      .populate('category')
      .populate('account')
      .exec();
  }

  async claimPending(id: string): Promise<ScheduledPayment> {
    return this.model
      .findOneAndUpdate(
        { _id: id, status: ScheduledPaymentStatus.PENDING },
        { $set: { status: ScheduledPaymentStatus.PROCESSING } },
        { new: true }
      )
      .exec();
  }

  async deletePending(id: string): Promise<ScheduledPayment> {
    return this.model
      .findOneAndDelete({ _id: id, status: ScheduledPaymentStatus.PENDING })
      .exec();
  }
}

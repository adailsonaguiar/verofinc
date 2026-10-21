import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { AccountType } from '../../entities/account.entity';
import {
  RecurrenceFrequency,
  ScheduledPayment,
  ScheduledPaymentStatus,
} from '../../entities/scheduled-payment.entity';
import { TransactionStatus } from '../../entities/transaction.entity';
import { AccountRepository } from '../../repositories/account.repository';
import {
  ScheduledPaymentFilters,
  ScheduledPaymentRepository,
} from '../../repositories/scheduled-payment.repository';
import { TransactionsService } from '../transactions/transactions.service';
import { CreateScheduledPaymentDto } from './dto/create-scheduled-payment.dto';
import { PayScheduledPaymentDto } from './dto/pay-scheduled-payment.dto';
import { UpdateScheduledPaymentDto } from './dto/update-scheduled-payment.dto';

@Injectable()
export class ScheduledPaymentsService {
  constructor(
    private readonly repository: ScheduledPaymentRepository,
    private readonly accountRepository: AccountRepository,
    private readonly transactionsService: TransactionsService
  ) {}

  private parseDateOnly(value: string): Date {
    const [year, month, day] = value.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  private addRecurrence(
    origin: Date,
    frequency: RecurrenceFrequency,
    interval: number
  ): Date {
    const next = new Date(origin);

    if (frequency === RecurrenceFrequency.WEEKLY) {
      next.setDate(next.getDate() + 7 * interval);
      return next;
    }

    const originalDay = next.getDate();
    next.setDate(1);
    if (frequency === RecurrenceFrequency.MONTHLY) {
      next.setMonth(next.getMonth() + interval);
    } else {
      next.setFullYear(next.getFullYear() + interval);
    }
    const lastDay = new Date(
      next.getFullYear(),
      next.getMonth() + 1,
      0
    ).getDate();
    next.setDate(Math.min(originalDay, lastDay));
    return next;
  }

  private async validateAccount(accountId: string): Promise<void> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) throw new NotFoundException('Conta não encontrada');
    if (!account.active) throw new BadRequestException('A conta está inativa');
    if (account.type === AccountType.CREDIT_CARD) {
      throw new BadRequestException(
        'Use o vencimento da fatura para compromissos de cartão de crédito'
      );
    }
  }

  async create(dto: CreateScheduledPaymentDto): Promise<ScheduledPayment> {
    await this.validateAccount(dto.account);
    const firstDueDate = this.parseDateOnly(dto.dueDate);
    const recurrenceEnd = dto.recurrence?.endDate
      ? this.parseDateOnly(dto.recurrence.endDate)
      : undefined;

    if (recurrenceEnd && recurrenceEnd < firstDueDate) {
      throw new BadRequestException(
        'A data final da recorrência deve ser posterior ao primeiro vencimento'
      );
    }

    const seriesId = dto.recurrence ? new Types.ObjectId() : undefined;

    const recurrence = dto.recurrence
      ? {
          frequency: dto.recurrence.frequency,
          interval: dto.recurrence.interval,
          endDate: recurrenceEnd,
          anchorDate: firstDueDate,
        }
      : undefined;

    return this.repository.create({
      description: dto.description.trim(),
      amount: Math.round(dto.amount * 100),
      dueDate: firstDueDate,
      type: dto.type,
      category: new Types.ObjectId(dto.categoryId),
      account: new Types.ObjectId(dto.account),
      status: ScheduledPaymentStatus.PENDING,
      recurrence,
      seriesId,
      occurrenceNumber: 1,
    });
  }

  findAll(filters: ScheduledPaymentFilters): Promise<ScheduledPayment[]> {
    return this.repository.findAll(filters);
  }

  async findOne(id: string): Promise<ScheduledPayment> {
    const payment = await this.repository.findById(id);
    if (!payment) throw new NotFoundException('Agendamento não encontrado');
    return payment;
  }

  async update(
    id: string,
    dto: UpdateScheduledPaymentDto
  ): Promise<ScheduledPayment> {
    const payment = await this.findOne(id);
    if (payment.status !== ScheduledPaymentStatus.PENDING) {
      throw new BadRequestException(
        'Somente agendamentos pendentes podem ser alterados'
      );
    }
    if (dto.account) await this.validateAccount(dto.account);

    return this.repository.update(id, {
      ...(dto.description !== undefined
        ? { description: dto.description.trim() }
        : {}),
      ...(dto.amount !== undefined
        ? { amount: Math.round(dto.amount * 100) }
        : {}),
      ...(dto.dueDate ? { dueDate: this.parseDateOnly(dto.dueDate) } : {}),
      ...(dto.type ? { type: dto.type } : {}),
      ...(dto.categoryId
        ? { category: new Types.ObjectId(dto.categoryId) }
        : {}),
      ...(dto.account ? { account: new Types.ObjectId(dto.account) } : {}),
    });
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.repository.deletePending(id);
    if (!deleted) {
      throw new BadRequestException(
        'Agendamento inexistente ou não está mais pendente'
      );
    }
  }

  async pay(
    id: string,
    dto: PayScheduledPaymentDto
  ): Promise<ScheduledPayment> {
    const claimed = await this.repository.claimPending(id);
    if (!claimed) {
      const existing = await this.repository.findById(id);
      if (!existing) throw new NotFoundException('Agendamento não encontrado');
      throw new ConflictException('Este agendamento já foi processado');
    }

    let transactionId: string | undefined;
    let nextPaymentId: string | undefined;
    try {
      const paidDate = dto.paidDate ?? new Date().toISOString().split('T')[0];
      const transaction = await this.transactionsService.create({
        description: claimed.description,
        amount: claimed.amount / 100,
        date: paidDate,
        type: claimed.type,
        categoryId: claimed.category.toString(),
        status: TransactionStatus.PAID,
        account: claimed.account.toString(),
        isFixed: false,
      });
      transactionId = (transaction as any)._id.toString();

      if (claimed.recurrence && claimed.seriesId) {
        const anchorDate = claimed.recurrence.anchorDate
          ? new Date(claimed.recurrence.anchorDate)
          : new Date(claimed.dueDate);
        const nextDueDate = this.addRecurrence(
          anchorDate,
          claimed.recurrence.frequency,
          claimed.recurrence.interval * claimed.occurrenceNumber
        );
        const recurrenceEnd = claimed.recurrence.endDate
          ? new Date(claimed.recurrence.endDate)
          : undefined;

        if (!recurrenceEnd || nextDueDate <= recurrenceEnd) {
          const nextPayment = await this.repository.create({
            description: claimed.description,
            amount: claimed.amount,
            dueDate: nextDueDate,
            type: claimed.type,
            category: claimed.category,
            account: claimed.account,
            status: ScheduledPaymentStatus.PENDING,
            recurrence: claimed.recurrence,
            seriesId: claimed.seriesId,
            occurrenceNumber: claimed.occurrenceNumber + 1,
          });
          nextPaymentId = (nextPayment as any)._id.toString();
        }
      }

      return await this.repository.update(id, {
        status: ScheduledPaymentStatus.PAID,
        paidAt: this.parseDateOnly(paidDate),
        transaction: new Types.ObjectId(transactionId),
      });
    } catch (error) {
      if (nextPaymentId) {
        await this.repository.deletePending(nextPaymentId);
      }
      if (transactionId) {
        await this.transactionsService.remove(transactionId);
      }
      await this.repository.update(id, {
        status: ScheduledPaymentStatus.PENDING,
        paidAt: undefined,
        transaction: undefined,
      });
      throw error;
    }
  }
}

import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { AccountType } from '../../entities/account.entity';
import {
  RecurrenceFrequency,
  ScheduledPaymentStatus,
} from '../../entities/scheduled-payment.entity';
import { TransactionType } from '../../entities/transaction.entity';
import { AccountRepository } from '../../repositories/account.repository';
import { ScheduledPaymentRepository } from '../../repositories/scheduled-payment.repository';
import { TransactionsService } from '../transactions/transactions.service';
import { ScheduledPaymentsService } from './scheduled-payments.service';

describe('ScheduledPaymentsService', () => {
  let service: ScheduledPaymentsService;
  let repository: {
    create: Mock;
    findAll: Mock;
    findById: Mock;
    update: Mock;
    claimPending: Mock;
    deletePending: Mock;
  };
  let accounts: { findById: Mock };
  let transactions: { create: Mock; remove: Mock };

  const accountId = new Types.ObjectId().toString();
  const categoryId = new Types.ObjectId().toString();

  beforeEach(async () => {
    repository = {
      create: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      claimPending: vi.fn(),
      deletePending: vi.fn(),
    };
    accounts = { findById: vi.fn() };
    transactions = { create: vi.fn(), remove: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduledPaymentsService,
        { provide: ScheduledPaymentRepository, useValue: repository },
        { provide: AccountRepository, useValue: accounts },
        { provide: TransactionsService, useValue: transactions },
      ],
    }).compile();

    service = module.get(ScheduledPaymentsService);
    accounts.findById.mockResolvedValue({
      _id: accountId,
      type: AccountType.CHECKING,
      active: true,
    });
    repository.create.mockImplementation(async (item) => ({
      ...item,
      _id: new Types.ObjectId(),
    }));
  });

  it('creates one pending occurrence and converts reais to cents', async () => {
    await service.create({
      description: '  Aluguel  ',
      amount: 1450.5,
      dueDate: '2026-11-10',
      type: TransactionType.EXPENSE,
      categoryId,
      account: accountId,
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Aluguel',
        amount: 145050,
        status: ScheduledPaymentStatus.PENDING,
        occurrenceNumber: 1,
      })
    );
  });

  it('creates only the first occurrence of a recurring schedule', async () => {
    await service.create({
      description: 'Condomínio',
      amount: 300,
      dueDate: '2026-01-31',
      type: TransactionType.EXPENSE,
      categoryId,
      account: accountId,
      recurrence: {
        frequency: RecurrenceFrequency.MONTHLY,
        interval: 1,
        endDate: '2026-04-30',
      },
    });

    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        dueDate: expect.any(Date),
        seriesId: expect.any(Types.ObjectId),
        occurrenceNumber: 1,
        recurrence: expect.objectContaining({
          frequency: RecurrenceFrequency.MONTHLY,
          interval: 1,
          anchorDate: expect.any(Date),
        }),
      })
    );
  });

  it('rejects a recurrence that ends before its first due date', async () => {
    await expect(
      service.create({
        description: 'Seguro',
        amount: 100,
        dueDate: '2026-10-10',
        type: TransactionType.EXPENSE,
        categoryId,
        account: accountId,
        recurrence: {
          frequency: RecurrenceFrequency.YEARLY,
          interval: 1,
          endDate: '2026-10-09',
        },
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects credit-card schedules because invoices own their due dates', async () => {
    accounts.findById.mockResolvedValue({
      type: AccountType.CREDIT_CARD,
      active: true,
    });

    await expect(
      service.create({
        description: 'Compra',
        amount: 100,
        dueDate: '2026-10-10',
        type: TransactionType.EXPENSE,
        categoryId,
        account: accountId,
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('delegates filtered listing and returns an existing occurrence', async () => {
    repository.findAll.mockResolvedValue([{ description: 'Água' }]);
    repository.findById.mockResolvedValue({ description: 'Água' });

    await expect(
      service.findAll({ status: ScheduledPaymentStatus.PENDING })
    ).resolves.toHaveLength(1);
    await expect(service.findOne('id')).resolves.toMatchObject({
      description: 'Água',
    });
  });

  it('updates a pending occurrence and converts its amount to cents', async () => {
    repository.findById.mockResolvedValue({
      status: ScheduledPaymentStatus.PENDING,
    });
    repository.update.mockResolvedValue({ description: 'Nova descrição' });

    await service.update('id', {
      description: '  Nova descrição ',
      amount: 49.9,
      dueDate: '2026-12-20',
      type: TransactionType.INCOME,
      categoryId,
      account: accountId,
    });

    expect(repository.update).toHaveBeenCalledWith(
      'id',
      expect.objectContaining({
        description: 'Nova descrição',
        amount: 4990,
        type: TransactionType.INCOME,
      })
    );
    expect(accounts.findById).toHaveBeenCalledWith(accountId);
  });

  it('does not allow editing a paid occurrence', async () => {
    repository.findById.mockResolvedValue({
      status: ScheduledPaymentStatus.PAID,
    });

    await expect(service.update('id', { amount: 10 })).rejects.toThrow(
      BadRequestException
    );
  });

  it('deletes only pending occurrences', async () => {
    repository.deletePending.mockResolvedValueOnce({ _id: 'id' });
    await expect(service.remove('id')).resolves.toBeUndefined();

    repository.deletePending.mockResolvedValueOnce(null);
    await expect(service.remove('id')).rejects.toThrow(BadRequestException);
  });

  it('claims a pending schedule, creates the paid transaction, and links it', async () => {
    const scheduledId = new Types.ObjectId().toString();
    const transactionId = new Types.ObjectId();
    repository.claimPending.mockResolvedValue({
      _id: scheduledId,
      description: 'Internet',
      amount: 12990,
      type: TransactionType.EXPENSE,
      category: new Types.ObjectId(categoryId),
      account: new Types.ObjectId(accountId),
    });
    transactions.create.mockResolvedValue({ _id: transactionId });
    repository.update.mockResolvedValue({
      _id: scheduledId,
      status: ScheduledPaymentStatus.PAID,
      transaction: transactionId,
    });

    const result = await service.pay(scheduledId, { paidDate: '2026-10-21' });

    expect(transactions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Internet',
        amount: 129.9,
        date: '2026-10-21',
        status: 'paid',
        isFixed: false,
      })
    );
    expect(repository.update).toHaveBeenCalledWith(
      scheduledId,
      expect.objectContaining({
        status: ScheduledPaymentStatus.PAID,
        transaction: transactionId,
      })
    );
    expect(result.status).toBe(ScheduledPaymentStatus.PAID);
  });

  it('creates only the next monthly occurrence after payment', async () => {
    const scheduledId = new Types.ObjectId().toString();
    const transactionId = new Types.ObjectId();
    const seriesId = new Types.ObjectId();
    repository.claimPending.mockResolvedValue({
      _id: scheduledId,
      description: 'Condomínio',
      amount: 45000,
      dueDate: new Date(2026, 1, 28, 12),
      type: TransactionType.EXPENSE,
      category: new Types.ObjectId(categoryId),
      account: new Types.ObjectId(accountId),
      seriesId,
      occurrenceNumber: 2,
      recurrence: {
        frequency: RecurrenceFrequency.MONTHLY,
        interval: 1,
        anchorDate: new Date(2026, 0, 31, 12),
      },
    });
    transactions.create.mockResolvedValue({ _id: transactionId });
    repository.update.mockResolvedValue({
      status: ScheduledPaymentStatus.PAID,
    });

    await service.pay(scheduledId, { paidDate: '2026-02-20' });

    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        dueDate: expect.any(Date),
        seriesId,
        occurrenceNumber: 3,
        status: ScheduledPaymentStatus.PENDING,
      })
    );
    const nextDueDate = repository.create.mock.calls[0][0].dueDate;
    expect(nextDueDate.getFullYear()).toBe(2026);
    expect(nextDueDate.getMonth()).toBe(2);
    expect(nextDueDate.getDate()).toBe(31);
  });

  it('supports weekly recurrence when creating the next occurrence', async () => {
    repository.claimPending.mockResolvedValue({
      description: 'Aula',
      amount: 8000,
      dueDate: new Date(2026, 0, 5, 12),
      type: TransactionType.EXPENSE,
      category: new Types.ObjectId(categoryId),
      account: new Types.ObjectId(accountId),
      seriesId: new Types.ObjectId(),
      occurrenceNumber: 1,
      recurrence: {
        frequency: RecurrenceFrequency.WEEKLY,
        interval: 2,
        anchorDate: new Date(2026, 0, 5, 12),
      },
    });
    transactions.create.mockResolvedValue({ _id: new Types.ObjectId() });
    repository.update.mockResolvedValue({ status: ScheduledPaymentStatus.PAID });

    await service.pay('schedule-id', {});

    expect(repository.create.mock.calls[0][0].dueDate.getDate()).toBe(19);
  });

  it('does not create another occurrence after the recurrence end date', async () => {
    repository.claimPending.mockResolvedValue({
      description: 'Seguro',
      amount: 20000,
      dueDate: new Date(2026, 1, 28, 12),
      type: TransactionType.EXPENSE,
      category: new Types.ObjectId(categoryId),
      account: new Types.ObjectId(accountId),
      seriesId: new Types.ObjectId(),
      occurrenceNumber: 2,
      recurrence: {
        frequency: RecurrenceFrequency.YEARLY,
        interval: 1,
        anchorDate: new Date(2025, 1, 28, 12),
        endDate: new Date(2026, 1, 28, 12),
      },
    });
    transactions.create.mockResolvedValue({ _id: new Types.ObjectId() });
    repository.update.mockResolvedValue({ status: ScheduledPaymentStatus.PAID });

    await service.pay('schedule-id', {});

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('prevents a second payment while an occurrence is being processed', async () => {
    repository.claimPending.mockResolvedValue(null);
    repository.findById.mockResolvedValue({
      status: ScheduledPaymentStatus.PROCESSING,
    });

    await expect(service.pay('existing-id', {})).rejects.toThrow(
      ConflictException
    );
    expect(transactions.create).not.toHaveBeenCalled();
  });

  it('restores pending status when transaction creation fails', async () => {
    repository.claimPending.mockResolvedValue({
      description: 'Energia',
      amount: 20000,
      type: TransactionType.EXPENSE,
      category: new Types.ObjectId(categoryId),
      account: new Types.ObjectId(accountId),
    });
    transactions.create.mockRejectedValue(new Error('ledger unavailable'));
    repository.update.mockResolvedValue({});

    await expect(service.pay('schedule-id', {})).rejects.toThrow(
      'ledger unavailable'
    );
    expect(repository.update).toHaveBeenCalledWith(
      'schedule-id',
      expect.objectContaining({ status: ScheduledPaymentStatus.PENDING })
    );
  });

  it('reverses the transaction if linking the paid occurrence fails', async () => {
    const transactionId = new Types.ObjectId();
    repository.claimPending.mockResolvedValue({
      description: 'Água',
      amount: 9500,
      type: TransactionType.EXPENSE,
      category: new Types.ObjectId(categoryId),
      account: new Types.ObjectId(accountId),
    });
    transactions.create.mockResolvedValue({ _id: transactionId });
    repository.update
      .mockRejectedValueOnce(new Error('write conflict'))
      .mockResolvedValueOnce({ status: ScheduledPaymentStatus.PENDING });
    transactions.remove.mockResolvedValue(undefined);

    await expect(service.pay('schedule-id', {})).rejects.toThrow(
      'write conflict'
    );
    expect(transactions.remove).toHaveBeenCalledWith(transactionId.toString());
    expect(repository.update).toHaveBeenLastCalledWith(
      'schedule-id',
      expect.objectContaining({ status: ScheduledPaymentStatus.PENDING })
    );
  });

  it('removes the generated next occurrence when finalizing payment fails', async () => {
    const transactionId = new Types.ObjectId();
    const nextPaymentId = new Types.ObjectId();
    repository.claimPending.mockResolvedValue({
      description: 'Internet',
      amount: 10000,
      dueDate: new Date(2026, 9, 10, 12),
      type: TransactionType.EXPENSE,
      category: new Types.ObjectId(categoryId),
      account: new Types.ObjectId(accountId),
      seriesId: new Types.ObjectId(),
      occurrenceNumber: 1,
      recurrence: {
        frequency: RecurrenceFrequency.MONTHLY,
        interval: 1,
        anchorDate: new Date(2026, 9, 10, 12),
      },
    });
    transactions.create.mockResolvedValue({ _id: transactionId });
    repository.create.mockResolvedValue({ _id: nextPaymentId });
    repository.update
      .mockRejectedValueOnce(new Error('write conflict'))
      .mockResolvedValueOnce({ status: ScheduledPaymentStatus.PENDING });
    repository.deletePending.mockResolvedValue({ _id: nextPaymentId });
    transactions.remove.mockResolvedValue(undefined);

    await expect(service.pay('schedule-id', {})).rejects.toThrow(
      'write conflict'
    );

    expect(repository.deletePending).toHaveBeenCalledWith(
      nextPaymentId.toString()
    );
    expect(transactions.remove).toHaveBeenCalledWith(transactionId.toString());
  });
});

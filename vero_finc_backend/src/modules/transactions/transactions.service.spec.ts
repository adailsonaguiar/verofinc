import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionRepository } from '../../repositories/transaction.repository';
import { LedgerService } from '../ledger/ledger.service';
import { AccountRepository } from '../../repositories/account.repository';
import {
  TransactionType,
  TransactionStatus,
} from '../../entities/transaction.entity';
import { AccountType } from '../../entities/account.entity';
import { Types } from 'mongoose';
import { describe, it, expect, beforeEach, vi, Mock, afterEach } from 'vitest';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionRepo: {
    create: Mock;
    delete: Mock;
    update: Mock;
    findById: Mock;
    findWithFilters: Mock;
    findAll: Mock;
    findByDescription: Mock;
    findByAccount: Mock;
    findByCategory: Mock;
    findByStatus: Mock;
    findByDateRange: Mock;
    findByMonth: Mock;
    getAvailableMonths: Mock;
    reorder: Mock;
  };
  let ledgerService: {
    logOperation: Mock;
    updateAccountBalance: Mock;
    findByTransactionId: Mock;
  };
  let accountRepo: { findAll: Mock; findById: Mock; update: Mock };

  const makeId = () => new Types.ObjectId();
  const makeCheckingAccount = (overrides: any = {}) => ({
    _id: makeId(),
    type: AccountType.CHECKING,
    name: 'Conta',
    ...overrides,
  });
  const makeCreditCard = (overrides: any = {}) => ({
    _id: makeId(),
    type: AccountType.CREDIT_CARD,
    name: 'Visa',
    ...overrides,
  });
  const makeTx = (overrides: any = {}) => ({
    _id: makeId(),
    description: 'Aluguel',
    amount: 150000,
    date: new Date('2026-05-01T12:00:00'),
    type: TransactionType.EXPENSE,
    status: TransactionStatus.PAID,
    account: makeId(),
    ...overrides,
  });

  beforeEach(async () => {
    transactionRepo = {
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      findById: vi.fn(),
      findWithFilters: vi.fn(),
      findAll: vi.fn(),
      findByDescription: vi.fn(),
      findByAccount: vi.fn(),
      findByCategory: vi.fn(),
      findByStatus: vi.fn(),
      findByDateRange: vi.fn(),
      findByMonth: vi.fn(),
      getAvailableMonths: vi.fn(),
      reorder: vi.fn(),
    };
    ledgerService = {
      logOperation: vi.fn(),
      updateAccountBalance: vi.fn(),
      findByTransactionId: vi.fn(),
    };
    accountRepo = {
      findAll: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: TransactionRepository, useValue: transactionRepo },
        { provide: LedgerService, useValue: ledgerService },
        { provide: AccountRepository, useValue: accountRepo },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should multiply amount by 100 before saving', async () => {
      const mockAccount = {
        _id: new Types.ObjectId(),
        type: AccountType.CHECKING,
        name: 'Conta',
      };
      accountRepo.findById.mockResolvedValue(mockAccount);

      const createdTx = {
        _id: new Types.ObjectId(),
        amount: 2500, // 25 * 100
        type: TransactionType.EXPENSE,
        status: TransactionStatus.UNPAID,
        account: mockAccount._id,
      };
      transactionRepo.create.mockResolvedValue(createdTx);

      await service.create({
        description: 'Test',
        amount: 25,
        date: '2026-05-01',
        type: TransactionType.EXPENSE,
        categoryId: new Types.ObjectId().toString(),
        status: TransactionStatus.UNPAID,
        account: mockAccount._id.toString(),
      });

      expect(transactionRepo.create).toHaveBeenCalled();
      const createArgs = transactionRepo.create.mock.calls[0][0];
      expect(createArgs.amount).toBe(2500); // 25 * 100
    });

    it('should log operation if status is PAID and rollback if ledger throws error', async () => {
      const mockAccount = {
        _id: new Types.ObjectId(),
        type: AccountType.CHECKING,
        name: 'Conta',
      };
      accountRepo.findById.mockResolvedValue(mockAccount);

      const createdTx = {
        _id: new Types.ObjectId(),
        amount: 3000,
        type: TransactionType.EXPENSE,
        status: TransactionStatus.PAID,
        account: mockAccount._id,
        description: 'Test Ledger Rollback',
      };

      transactionRepo.create.mockResolvedValue(createdTx);

      // Simulate ledger error (e.g. insufficient funds)
      ledgerService.logOperation.mockRejectedValue(
        new Error('Insufficient funds')
      );

      await expect(
        service.create({
          description: 'Test Ledger Rollback',
          amount: 30,
          date: '2026-05-01',
          type: TransactionType.EXPENSE,
          categoryId: new Types.ObjectId().toString(),
          status: TransactionStatus.PAID,
          account: mockAccount._id.toString(),
        })
      ).rejects.toThrow('Insufficient funds');

      // Ensure transaction was deleted
      expect(transactionRepo.delete).toHaveBeenCalledWith(
        createdTx._id.toString()
      );
    });

    it('should automatically create future duplicates if isFixed is true', async () => {
      const mockAccount = {
        _id: new Types.ObjectId(),
        type: AccountType.CHECKING,
        name: 'Conta',
      };
      accountRepo.findById.mockResolvedValue(mockAccount);

      const createdTx = {
        _id: new Types.ObjectId(),
        amount: 5000,
        type: TransactionType.EXPENSE,
        status: TransactionStatus.UNPAID,
        account: mockAccount._id,
        date: new Date('2026-05-01T12:00:00'),
      };

      transactionRepo.create.mockResolvedValue(createdTx);

      await service.create({
        description: 'Fixed expense',
        amount: 50,
        date: '2026-05-01',
        type: TransactionType.EXPENSE,
        categoryId: new Types.ObjectId().toString(),
        status: TransactionStatus.UNPAID,
        account: mockAccount._id.toString(),
        isFixed: true,
      });

      // 1 base + 11 future
      expect(transactionRepo.create).toHaveBeenCalledTimes(12);
    });
  });

  describe('update', () => {
    it('should correctly calculate net difference if updating amount in the same account', async () => {
      const mockAccount = {
        _id: new Types.ObjectId(),
        type: AccountType.CHECKING,
      };
      accountRepo.findById.mockResolvedValue(mockAccount);

      const oldTx = {
        _id: new Types.ObjectId().toString(),
        amount: 10000, // 100 * 100
        type: TransactionType.EXPENSE,
        status: TransactionStatus.PAID,
        account: mockAccount._id,
      };

      transactionRepo.findById.mockResolvedValue(oldTx);
      transactionRepo.update.mockResolvedValue(oldTx); // return updated

      await service.update(oldTx._id, {
        amount: 150, // becomes 15000
      });

      expect(ledgerService.logOperation).toHaveBeenCalled();
      const logArgs = ledgerService.logOperation.mock.calls[0];
      // Old was 10000 (expense is negated so -10000)
      // New is 15000 (expense is negated so -15000)
      // Difference -> -15000 - (-10000) = -5000. So logOperation should be called with -5000.
      expect(logArgs[1]).toBe(-5000);
    });

    it('should fully process a cross-account transfer update safely', async () => {
      const mockAccountOld = {
        _id: new Types.ObjectId(),
        type: AccountType.CHECKING,
        name: 'Old',
      };
      const mockAccountNew = {
        _id: new Types.ObjectId(),
        type: AccountType.CHECKING,
        name: 'New',
      };

      accountRepo.findById.mockImplementation((id) => {
        if (id === mockAccountOld._id.toString()) return mockAccountOld;
        if (id === mockAccountNew._id.toString()) return mockAccountNew;
        return null;
      });

      const oldTx = {
        _id: new Types.ObjectId().toString(),
        amount: 2000, // 20
        type: TransactionType.INCOME,
        status: TransactionStatus.PAID,
        account: mockAccountOld._id,
      };

      transactionRepo.findById.mockResolvedValue(oldTx);
      transactionRepo.update.mockResolvedValue({
        ...oldTx,
        account: mockAccountNew._id,
      });

      await service.update(oldTx._id, {
        account: mockAccountNew._id.toString(),
      });

      // It should revert the old account and apply to the new account
      expect(ledgerService.logOperation).toHaveBeenCalledTimes(2);

      // The order might vary depending on whether it's subtracting first to prevent overdrafts.
      // Since it's an INCOME, reverting it means subtracting.
      const calls = ledgerService.logOperation.mock.calls;

      // the revert on the old account
      expect(
        calls.some(
          (args) =>
            args[2].toString() === mockAccountOld._id.toString() &&
            args[1] === -2000
        )
      ).toBe(true);
      // the application on the new account
      expect(
        calls.some(
          (args) =>
            args[2].toString() === mockAccountNew._id.toString() &&
            args[1] === 2000
        )
      ).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // create – credit card validations
  // ---------------------------------------------------------------------------
  describe('create – credit card validations', () => {
    it('should throw NotFoundException when account does not exist', async () => {
      accountRepo.findById.mockResolvedValue(null);

      await expect(
        service.create({
          description: 'Test',
          amount: 10,
          date: '2026-05-01',
          type: TransactionType.EXPENSE,
          categoryId: makeId().toString(),
          status: TransactionStatus.UNPAID,
          account: makeId().toString(),
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when creating UNPAID on credit card', async () => {
      accountRepo.findById.mockResolvedValue(makeCreditCard());

      await expect(
        service.create({
          description: 'Test',
          amount: 10,
          date: '2026-05-01',
          type: TransactionType.EXPENSE,
          categoryId: makeId().toString(),
          status: TransactionStatus.UNPAID,
          account: makeId().toString(),
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when creating INCOME on credit card without bypass', async () => {
      accountRepo.findById.mockResolvedValue(makeCreditCard());

      await expect(
        service.create({
          description: 'Test',
          amount: 10,
          date: '2026-05-01',
          type: TransactionType.INCOME,
          categoryId: makeId().toString(),
          status: TransactionStatus.PAID,
          account: makeId().toString(),
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow INCOME on credit card when byPassCreditInvoiceCheck=true', async () => {
      const card = makeCreditCard();
      accountRepo.findById.mockResolvedValue(card);
      const tx = makeTx({
        type: TransactionType.INCOME,
        status: TransactionStatus.PAID,
      });
      transactionRepo.create.mockResolvedValue(tx);
      ledgerService.logOperation.mockResolvedValue(undefined);

      await expect(
        service.create(
          {
            description: 'Invoice payment',
            amount: 10,
            date: '2026-05-01',
            type: TransactionType.INCOME,
            categoryId: makeId().toString(),
            status: TransactionStatus.PAID,
            account: card._id.toString(),
          },
          true
        )
      ).resolves.not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // findWithFilters
  // ---------------------------------------------------------------------------
  describe('findWithFilters', () => {
    it('should return filtered and sorted transactions', async () => {
      const accId = makeId();
      const checkingAcc = makeCheckingAccount({ _id: accId });
      const txs = [
        makeTx({ account: accId, date: new Date('2026-05-01') }),
        makeTx({ account: accId, date: new Date('2026-04-01') }),
      ];
      accountRepo.findAll.mockResolvedValue([checkingAcc]);
      transactionRepo.findWithFilters.mockResolvedValue(txs);

      const result = await service.findWithFilters({});

      expect(transactionRepo.findWithFilters).toHaveBeenCalledWith({});
      // Sorted descending by date
      expect(new Date(result[0].date).getTime()).toBeGreaterThan(
        new Date(result[1].date).getTime()
      );
    });

    it('should skip credit-card INCOME filter when withCreditCardFilter=true', async () => {
      const cardId = makeId();
      const card = makeCreditCard({ _id: cardId });
      const incomeTx = makeTx({
        account: cardId,
        type: TransactionType.INCOME,
        status: TransactionStatus.PAID,
      });
      accountRepo.findAll.mockResolvedValue([card]);
      transactionRepo.findWithFilters.mockResolvedValue([incomeTx]);

      const result = await service.findWithFilters({
        withCreditCardFilter: true,
      });

      // Should NOT call findAll (no filtering)
      expect(accountRepo.findAll).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should filter out credit-card INCOME transactions when withCreditCardFilter is absent', async () => {
      const cardId = makeId();
      const card = makeCreditCard({ _id: cardId });
      const incomeTx = makeTx({
        account: cardId,
        type: TransactionType.INCOME,
      });
      const expenseTx = makeTx({
        account: cardId,
        type: TransactionType.EXPENSE,
      });
      accountRepo.findAll.mockResolvedValue([card]);
      transactionRepo.findWithFilters.mockResolvedValue([incomeTx, expenseTx]);

      const result = await service.findWithFilters({});

      expect(result.every((t) => t.type !== TransactionType.INCOME)).toBe(true);
      expect(result).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // findOne
  // ---------------------------------------------------------------------------
  describe('findOne', () => {
    it('should return the transaction when found', async () => {
      const tx = makeTx();
      transactionRepo.findById.mockResolvedValue(tx);

      const result = await service.findOne(tx._id.toString());

      expect(result).toEqual(tx);
    });

    it('should throw NotFoundException when transaction does not exist', async () => {
      transactionRepo.findById.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  // ---------------------------------------------------------------------------
  // update – validations
  // ---------------------------------------------------------------------------
  describe('update – validations', () => {
    it('should throw NotFoundException when transaction to update does not exist', async () => {
      transactionRepo.findById.mockResolvedValue(null);

      await expect(service.update('bad-id', { amount: 10 })).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw NotFoundException when account does not exist during update', async () => {
      const tx = makeTx({ status: TransactionStatus.UNPAID });
      transactionRepo.findById.mockResolvedValue(tx);
      accountRepo.findById.mockResolvedValue(null);

      await expect(
        service.update(tx._id.toString(), { description: 'X' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when setting UNPAID on credit card', async () => {
      const card = makeCreditCard();
      const tx = makeTx({
        account: card._id,
        status: TransactionStatus.PAID,
        type: TransactionType.EXPENSE,
      });
      transactionRepo.findById.mockResolvedValue(tx);
      accountRepo.findById.mockResolvedValue(card);

      await expect(
        service.update(tx._id.toString(), { status: TransactionStatus.UNPAID })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when setting INCOME type on credit card', async () => {
      const card = makeCreditCard();
      const tx = makeTx({
        account: card._id,
        status: TransactionStatus.PAID,
        type: TransactionType.EXPENSE,
      });
      transactionRepo.findById.mockResolvedValue(tx);
      accountRepo.findById.mockResolvedValue(card);

      await expect(
        service.update(tx._id.toString(), { type: TransactionType.INCOME })
      ).rejects.toThrow(BadRequestException);
    });

    it('should rollback to original when ledger update throws', async () => {
      const acc = makeCheckingAccount();
      const originalTx = makeTx({
        account: acc._id,
        status: TransactionStatus.PAID,
        type: TransactionType.EXPENSE,
        amount: 10000,
      });
      transactionRepo.findById.mockResolvedValue(originalTx);
      accountRepo.findById.mockResolvedValue(acc);
      transactionRepo.update.mockResolvedValue({
        ...originalTx,
        amount: 20000,
      });
      ledgerService.logOperation.mockRejectedValue(new Error('ledger fail'));

      await expect(
        service.update(originalTx._id.toString(), { amount: 200 })
      ).rejects.toThrow('ledger fail');

      // Should have called update again to restore original
      expect(transactionRepo.update).toHaveBeenCalledTimes(2);
      const rollbackArgs = transactionRepo.update.mock.calls[1];
      expect(rollbackArgs[1]).toEqual(originalTx);
    });
  });

  // ---------------------------------------------------------------------------
  // remove
  // ---------------------------------------------------------------------------
  describe('remove', () => {
    it('should delete a PAID transaction and log the reversal', async () => {
      const acc = makeCheckingAccount();
      const tx = makeTx({
        account: acc._id,
        status: TransactionStatus.PAID,
        type: TransactionType.EXPENSE,
        amount: 5000,
      });
      transactionRepo.findById.mockResolvedValue(tx);
      transactionRepo.delete.mockResolvedValue(tx);
      ledgerService.logOperation.mockResolvedValue(undefined);

      await service.remove(tx._id.toString());

      expect(transactionRepo.delete).toHaveBeenCalledWith(tx._id.toString());
      expect(ledgerService.logOperation).toHaveBeenCalledTimes(1);
      // expense reversal: positive amount
      expect(ledgerService.logOperation.mock.calls[0][1]).toBe(5000);
    });

    it('should delete an UNPAID transaction without logging to ledger', async () => {
      const tx = makeTx({ status: TransactionStatus.UNPAID });
      transactionRepo.findById.mockResolvedValue(tx);
      transactionRepo.delete.mockResolvedValue(tx);

      await service.remove(tx._id.toString());

      expect(transactionRepo.delete).toHaveBeenCalled();
      expect(ledgerService.logOperation).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when transaction does not exist', async () => {
      transactionRepo.findById.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should rollback (re-create) transaction if ledger throws after deletion', async () => {
      const tx = makeTx({
        status: TransactionStatus.PAID,
        type: TransactionType.EXPENSE,
      });
      transactionRepo.findById.mockResolvedValue(tx);
      transactionRepo.delete.mockResolvedValue(tx);
      transactionRepo.create.mockResolvedValue(tx);
      ledgerService.logOperation.mockRejectedValue(new Error('ledger fail'));

      await expect(service.remove(tx._id.toString())).rejects.toThrow(
        'ledger fail'
      );

      expect(transactionRepo.create).toHaveBeenCalledWith(tx);
    });
  });

  // ---------------------------------------------------------------------------
  // buildDateWithCurrentTime
  // ---------------------------------------------------------------------------
  describe('buildDateWithCurrentTime', () => {
    const FIXED_NOW = new Date('2026-05-07T17:30:45.123Z');

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(FIXED_NOW);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should preserve the date portion and inject the current time (string input)', () => {
      const input = '2026-03-15';
      const expectedBase = new Date(input);
      const result = (service as any).buildDateWithCurrentTime(input);

      expect(result.getFullYear()).toBe(expectedBase.getFullYear());
      expect(result.getMonth()).toBe(expectedBase.getMonth());
      expect(result.getDate()).toBe(expectedBase.getDate());
      expect(result.getHours()).toBe(FIXED_NOW.getHours());
      expect(result.getMinutes()).toBe(FIXED_NOW.getMinutes());
      expect(result.getSeconds()).toBe(FIXED_NOW.getSeconds());
      expect(result.getMilliseconds()).toBe(FIXED_NOW.getMilliseconds());
    });

    it('should preserve the date portion and inject the current time (Date object input)', () => {
      const input = new Date('2025-12-01T08:00:00');
      const result = (service as any).buildDateWithCurrentTime(input);

      expect(result.getFullYear()).toBe(input.getFullYear());
      expect(result.getMonth()).toBe(input.getMonth());
      expect(result.getDate()).toBe(input.getDate());
      expect(result.getHours()).toBe(FIXED_NOW.getHours());
      expect(result.getMinutes()).toBe(FIXED_NOW.getMinutes());
      expect(result.getSeconds()).toBe(FIXED_NOW.getSeconds());
      expect(result.getMilliseconds()).toBe(FIXED_NOW.getMilliseconds());
    });

    it('should inject current time when creating a transaction', async () => {
      const acc = makeCheckingAccount();
      accountRepo.findById.mockResolvedValue(acc);
      let capturedDate: Date | undefined;
      transactionRepo.create.mockImplementation((tx: any) => {
        capturedDate = tx.date;
        return { ...tx, _id: makeId(), status: TransactionStatus.UNPAID };
      });

      await service.create({
        description: 'Test',
        amount: 10,
        date: '2026-01-20',
        type: TransactionType.EXPENSE,
        categoryId: makeId().toString(),
        status: TransactionStatus.UNPAID,
        account: acc._id.toString(),
      });

      const expectedBase = new Date('2026-01-20');
      expect(capturedDate!.getFullYear()).toBe(expectedBase.getFullYear());
      expect(capturedDate!.getMonth()).toBe(expectedBase.getMonth());
      expect(capturedDate!.getDate()).toBe(expectedBase.getDate());
      expect(capturedDate!.getHours()).toBe(FIXED_NOW.getHours());
      expect(capturedDate!.getMinutes()).toBe(FIXED_NOW.getMinutes());
      expect(capturedDate!.getSeconds()).toBe(FIXED_NOW.getSeconds());
      expect(capturedDate!.getMilliseconds()).toBe(FIXED_NOW.getMilliseconds());
    });
  });

  // ---------------------------------------------------------------------------
  // getAvailableMonths
  // ---------------------------------------------------------------------------
  describe('getAvailableMonths', () => {
    it('should delegate to transactionRepository.getAvailableMonths', async () => {
      const months = [
        { year: 2026, month: 5 },
        { year: 2026, month: 4 },
      ];
      transactionRepo.getAvailableMonths.mockResolvedValue(months);

      const result = await service.getAvailableMonths();

      expect(transactionRepo.getAvailableMonths).toHaveBeenCalledTimes(1);
      expect(result).toEqual(months);
    });
  });

  // ---------------------------------------------------------------------------
  // reorder
  // ---------------------------------------------------------------------------
  describe('reorder', () => {
    it('should delegate to transactionRepository.reorder', async () => {
      const ids = [
        new Types.ObjectId().toString(),
        new Types.ObjectId().toString(),
        new Types.ObjectId().toString(),
      ];
      transactionRepo.reorder.mockResolvedValue(undefined);

      await service.reorder(ids);

      expect(transactionRepo.reorder).toHaveBeenCalledOnce();
      expect(transactionRepo.reorder).toHaveBeenCalledWith(ids);
    });

    it('should pass an empty array when ids is empty', async () => {
      transactionRepo.reorder.mockResolvedValue(undefined);

      await service.reorder([]);

      expect(transactionRepo.reorder).toHaveBeenCalledWith([]);
    });
  });

  // ---------------------------------------------------------------------------
  // sortTransactionsByDate (sortOrder-aware)
  // ---------------------------------------------------------------------------
  describe('sortTransactionsByDate (via findWithFilters)', () => {
    it('should return items ordered by sortOrder DESC when sortOrder differs', async () => {
      const account = makeCheckingAccount();
      accountRepo.findAll.mockResolvedValue([account]);

      const accId = account._id;
      const txA = makeTx({
        account: accId,
        sortOrder: 1,
        date: new Date('2026-05-01'),
      });
      const txB = makeTx({
        account: accId,
        sortOrder: 5,
        date: new Date('2026-05-01'),
      });
      const txC = makeTx({
        account: accId,
        sortOrder: 3,
        date: new Date('2026-05-01'),
      });

      // repo returns them in arbitrary order; service must sort
      transactionRepo.findWithFilters.mockResolvedValue([txA, txC, txB]);

      const result = await service.findWithFilters({});

      expect(result[0].sortOrder).toBe(5);
      expect(result[1].sortOrder).toBe(3);
      expect(result[2].sortOrder).toBe(1);
    });

    it('should fall back to date DESC when sortOrder is equal', async () => {
      const account = makeCheckingAccount();
      accountRepo.findAll.mockResolvedValue([account]);

      const accId = account._id;
      const older = makeTx({
        account: accId,
        sortOrder: 0,
        date: new Date('2026-04-01'),
      });
      const newer = makeTx({
        account: accId,
        sortOrder: 0,
        date: new Date('2026-05-15'),
      });

      transactionRepo.findWithFilters.mockResolvedValue([older, newer]);

      const result = await service.findWithFilters({});

      expect(new Date(result[0].date).getTime()).toBeGreaterThan(
        new Date(result[1].date).getTime()
      );
    });

    it('should place higher sortOrder before newer date', async () => {
      const account = makeCheckingAccount();
      accountRepo.findAll.mockResolvedValue([account]);

      const accId = account._id;
      // txOld has higher sortOrder and an older date — should still come first
      const txOld = makeTx({
        account: accId,
        sortOrder: 10,
        date: new Date('2025-01-01'),
      });
      // txNew has lower sortOrder and a newer date
      const txNew = makeTx({
        account: accId,
        sortOrder: 1,
        date: new Date('2026-05-01'),
      });

      transactionRepo.findWithFilters.mockResolvedValue([txNew, txOld]);

      const result = await service.findWithFilters({});

      expect(result[0].sortOrder).toBe(10);
      expect(result[1].sortOrder).toBe(1);
    });
  });
});

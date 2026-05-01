import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { TransactionRepository } from '../../repositories/transaction.repository';
import { LedgerService } from '../ledger/ledger.service';
import { AccountRepository } from '../../repositories/account.repository';
import { TransactionType, TransactionStatus } from '../../entities/transaction.entity';
import { AccountType } from '../../entities/account.entity';
import { Types } from 'mongoose';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionRepo: { create: Mock; delete: Mock; update: Mock; findById: Mock; findWithFilters: Mock };
  let ledgerService: { logOperation: Mock; updateAccountBalance: Mock; findByTransactionId: Mock };
  let accountRepo: { findAll: Mock; findById: Mock; update: Mock };

  beforeEach(async () => {
    transactionRepo = {
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      findById: vi.fn(),
      findWithFilters: vi.fn(),
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
      const mockAccount = { _id: new Types.ObjectId(), type: AccountType.CHECKING, name: 'Conta' };
      accountRepo.findById.mockResolvedValue(mockAccount);
      
      const createdTx = { 
        _id: new Types.ObjectId(), 
        amount: 2500, // 25 * 100
        type: TransactionType.EXPENSE,
        status: TransactionStatus.UNPAID,
        account: mockAccount._id
      };
      transactionRepo.create.mockResolvedValue(createdTx);

      await service.create({
        description: 'Test',
        amount: 25,
        date: '2026-05-01',
        type: TransactionType.EXPENSE,
        categoryId: new Types.ObjectId().toString(),
        status: TransactionStatus.UNPAID,
        account: mockAccount._id.toString()
      });

      expect(transactionRepo.create).toHaveBeenCalled();
      const createArgs = transactionRepo.create.mock.calls[0][0];
      expect(createArgs.amount).toBe(2500); // 25 * 100
    });

    it('should log operation if status is PAID and rollback if ledger throws error', async () => {
      const mockAccount = { _id: new Types.ObjectId(), type: AccountType.CHECKING, name: 'Conta' };
      accountRepo.findById.mockResolvedValue(mockAccount);
      
      const createdTx = { 
        _id: new Types.ObjectId(), 
        amount: 3000, 
        type: TransactionType.EXPENSE,
        status: TransactionStatus.PAID,
        account: mockAccount._id,
        description: 'Test Ledger Rollback'
      };
      
      transactionRepo.create.mockResolvedValue(createdTx);
      
      // Simulate ledger error (e.g. insufficient funds)
      ledgerService.logOperation.mockRejectedValue(new Error('Insufficient funds'));

      await expect(service.create({
        description: 'Test Ledger Rollback',
        amount: 30,
        date: '2026-05-01',
        type: TransactionType.EXPENSE,
        categoryId: new Types.ObjectId().toString(),
        status: TransactionStatus.PAID,
        account: mockAccount._id.toString()
      })).rejects.toThrow('Insufficient funds');

      // Ensure transaction was deleted
      expect(transactionRepo.delete).toHaveBeenCalledWith(createdTx._id.toString());
    });

    it('should automatically create future duplicates if isFixed is true', async () => {
      const mockAccount = { _id: new Types.ObjectId(), type: AccountType.CHECKING, name: 'Conta' };
      accountRepo.findById.mockResolvedValue(mockAccount);
      
      const createdTx = { 
        _id: new Types.ObjectId(), 
        amount: 5000, 
        type: TransactionType.EXPENSE,
        status: TransactionStatus.UNPAID,
        account: mockAccount._id,
        date: new Date('2026-05-01T12:00:00')
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
        isFixed: true
      });

      // 1 base + 11 future
      expect(transactionRepo.create).toHaveBeenCalledTimes(12);
    });
  });

  describe('update', () => {
    it('should correctly calculate net difference if updating amount in the same account', async () => {
      const mockAccount = { _id: new Types.ObjectId(), type: AccountType.CHECKING };
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
        amount: 150 // becomes 15000
      });

      expect(ledgerService.logOperation).toHaveBeenCalled();
      const logArgs = ledgerService.logOperation.mock.calls[0];
      // Old was 10000 (expense is negated so -10000)
      // New is 15000 (expense is negated so -15000)
      // Difference -> -15000 - (-10000) = -5000. So logOperation should be called with -5000.
      expect(logArgs[1]).toBe(-5000); 
    });

    it('should fully process a cross-account transfer update safely', async () => {
      const mockAccountOld = { _id: new Types.ObjectId(), type: AccountType.CHECKING, name: 'Old' };
      const mockAccountNew = { _id: new Types.ObjectId(), type: AccountType.CHECKING, name: 'New' };
      
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
        account: mockAccountNew._id
      });

      await service.update(oldTx._id, {
        account: mockAccountNew._id.toString()
      });

      // It should revert the old account and apply to the new account
      expect(ledgerService.logOperation).toHaveBeenCalledTimes(2);
      
      // The order might vary depending on whether it's subtracting first to prevent overdrafts.
      // Since it's an INCOME, reverting it means subtracting.
      const calls = ledgerService.logOperation.mock.calls;
      
      // the revert on the old account
      expect(calls.some(args => args[2].toString() === mockAccountOld._id.toString() && args[1] === -2000)).toBe(true);
      // the application on the new account
      expect(calls.some(args => args[2].toString() === mockAccountNew._id.toString() && args[1] === 2000)).toBe(true);
    });
  });
});

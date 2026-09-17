import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountRepository } from '../../repositories/account.repository';
import { TransactionsService } from '../transactions/transactions.service';
import { CategoriesService } from '../categories/categories.service';
import { AccountType } from '../../entities/account.entity';
import {
  TransactionType,
  TransactionStatus,
} from '../../entities/transaction.entity';
import { Types } from 'mongoose';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

describe('AccountService', () => {
  let service: AccountService;
  let accountRepo: {
    create: Mock;
    findAll: Mock;
    findById: Mock;
    update: Mock;
    delete: Mock;
  };
  let transactionsService: { create: Mock; findWithFilters: Mock };
  let categoriesService: { findByType: Mock; create: Mock };

  const makeId = () => new Types.ObjectId();

  beforeEach(async () => {
    accountRepo = {
      create: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    transactionsService = {
      create: vi.fn(),
      findWithFilters: vi.fn().mockResolvedValue([]),
    };

    categoriesService = {
      findByType: vi.fn(),
      create: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        { provide: AccountRepository, useValue: accountRepo },
        { provide: TransactionsService, useValue: transactionsService },
        { provide: CategoriesService, useValue: categoriesService },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should multiply initialBalance and creditLimit by 100 before saving', async () => {
      const payload = {
        name: 'Conta Corrente',
        type: AccountType.CHECKING,
        initialBalance: 500,
        creditLimit: 0,
      };
      const created = {
        _id: makeId(),
        ...payload,
        initialBalance: 50000,
        creditLimit: 0,
      };
      accountRepo.create.mockResolvedValue(created);

      const result = await service.create(payload);

      expect(accountRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ initialBalance: 50000, creditLimit: 0 })
      );
      expect(result).toEqual(created);
    });

    it('should default amounts to 0 when not provided', async () => {
      const payload = { name: 'Sem saldo', type: AccountType.CHECKING };
      accountRepo.create.mockResolvedValue({
        _id: makeId(),
        ...payload,
        initialBalance: 0,
        creditLimit: 0,
      });

      await service.create(payload);

      const args = accountRepo.create.mock.calls[0][0];
      expect(args.initialBalance).toBe(0);
      expect(args.creditLimit).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    it('should return all accounts', async () => {
      const accounts = [
        { _id: makeId(), name: 'A' },
        { _id: makeId(), name: 'B' },
      ];
      accountRepo.findAll.mockResolvedValue(accounts);

      const result = await service.findAll();

      expect(result).toEqual(accounts);
      expect(accountRepo.findAll).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // findById
  // ---------------------------------------------------------------------------
  describe('findById', () => {
    it('should return the account when found', async () => {
      const id = makeId().toString();
      const account = { _id: id, name: 'Conta' };
      accountRepo.findById.mockResolvedValue(account);

      const result = await service.findById(id);

      expect(result).toEqual(account);
    });

    it('should throw NotFoundException when account is not found', async () => {
      accountRepo.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should update account without multiplying amounts when isFromApi is false (default)', async () => {
      const id = makeId().toString();
      const updated = { _id: id, name: 'Novo Nome', initialBalance: 10000 };
      accountRepo.update.mockResolvedValue(updated);

      const result = await service.update(id, {
        name: 'Novo Nome',
        initialBalance: 10000,
      });

      const args = accountRepo.update.mock.calls[0][1];
      expect(args.initialBalance).toBe(10000); // não multiplicado
      expect(result).toEqual(updated);
    });

    it('should multiply initialBalance and creditLimit by 100 when isFromApi is true', async () => {
      const id = makeId().toString();
      const updated = { _id: id, initialBalance: 20000, creditLimit: 50000 };
      accountRepo.update.mockResolvedValue(updated);

      await service.update(id, { initialBalance: 200, creditLimit: 500 }, true);

      const args = accountRepo.update.mock.calls[0][1];
      expect(args.initialBalance).toBe(20000);
      expect(args.creditLimit).toBe(50000);
    });

    it('should throw NotFoundException when account does not exist', async () => {
      accountRepo.update.mockResolvedValue(null);

      await expect(
        service.update('bad-id', { name: 'X' }, true)
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // delete
  // ---------------------------------------------------------------------------
  describe('delete', () => {
    it('should delete and return the account', async () => {
      const id = makeId().toString();
      const deleted = { _id: id, name: 'Deletada' };
      accountRepo.delete.mockResolvedValue(deleted);

      const result = await service.delete(id);

      expect(result).toEqual(deleted);
    });

    it('should throw NotFoundException when account does not exist', async () => {
      accountRepo.delete.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  // ---------------------------------------------------------------------------
  // findByType
  // ---------------------------------------------------------------------------
  describe('findByType', () => {
    it('should return only accounts matching the given type', async () => {
      const checking = {
        _id: makeId(),
        name: 'Corrente',
        type: AccountType.CHECKING,
      };
      const creditCard = {
        _id: makeId(),
        name: 'Visa',
        type: AccountType.CREDIT_CARD,
      };
      accountRepo.findAll.mockResolvedValue([checking, creditCard]);

      const result = await service.findByType(AccountType.CHECKING);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(checking);
    });

    it('should return empty array when no accounts match the type', async () => {
      accountRepo.findAll.mockResolvedValue([
        { _id: makeId(), type: AccountType.CHECKING },
      ]);

      const result = await service.findByType(AccountType.CREDIT_CARD);

      expect(result).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // payInvoice
  // ---------------------------------------------------------------------------
  describe('payInvoice', () => {
    const buildCreditCard = (overrides = {}) => ({
      _id: makeId(),
      name: 'Visa Gold',
      type: AccountType.CREDIT_CARD,
      creditLimit: 100000, // R$ 1.000,00 in cents
      initialBalance: 60000, // R$ 600,00 in cents (= R$ 400 spent → invoice R$ 400)
      ...overrides,
    });

    const buildCheckingAccount = (overrides = {}) => ({
      _id: makeId(),
      name: 'Nubank',
      type: AccountType.CHECKING,
      initialBalance: 500000,
      creditLimit: 0,
      ...overrides,
    });

    it('should throw NotFoundException when credit card is not found', async () => {
      accountRepo.findById.mockResolvedValueOnce(null);

      await expect(
        service.payInvoice('cc-id', 'check-id', 2026, 5)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when first account is not a credit card', async () => {
      const notACard = buildCheckingAccount();
      accountRepo.findById.mockResolvedValueOnce(notACard);

      await expect(
        service.payInvoice(notACard._id.toString(), 'check-id', 2026, 5)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when checking account is not found', async () => {
      const card = buildCreditCard();
      accountRepo.findById.mockResolvedValueOnce(card);
      accountRepo.findById.mockResolvedValueOnce(null);

      await expect(
        service.payInvoice(card._id.toString(), 'check-id', 2026, 5)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when second account is not a checking account', async () => {
      const card = buildCreditCard();
      const anotherCard = buildCreditCard({ name: 'Mastercard' });
      accountRepo.findById.mockResolvedValueOnce(card);
      accountRepo.findById.mockResolvedValueOnce(anotherCard);

      await expect(
        service.payInvoice(
          card._id.toString(),
          anotherCard._id.toString(),
          2026,
          5
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when there is no invoice to pay (no expenses in month)', async () => {
      // findWithFilters returns no transactions → invoiceAmount = 0
      const card = buildCreditCard();
      const checking = buildCheckingAccount();
      accountRepo.findById.mockResolvedValueOnce(card);
      accountRepo.findById.mockResolvedValueOnce(checking);
      transactionsService.findWithFilters.mockResolvedValueOnce([]);

      await expect(
        service.payInvoice(
          card._id.toString(),
          checking._id.toString(),
          2026,
          5
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should reuse existing "Pagamento de Fatura" category when available', async () => {
      const card = buildCreditCard();
      const checking = buildCheckingAccount();
      accountRepo.findById.mockResolvedValueOnce(card);
      accountRepo.findById.mockResolvedValueOnce(checking);
      transactionsService.findWithFilters.mockResolvedValueOnce([
        { type: TransactionType.EXPENSE, isPayment: false, amount: 10000 },
      ]);

      const existingCategory = {
        _id: makeId(),
        name: 'Pagamento de Fatura',
        type: 'expense',
      };
      categoriesService.findByType.mockResolvedValue([existingCategory]);
      transactionsService.create.mockResolvedValue({});

      await service.payInvoice(
        card._id.toString(),
        checking._id.toString(),
        2026,
        5
      );

      expect(categoriesService.create).not.toHaveBeenCalled();
    });

    it('should create "Pagamento de Fatura" category when it does not exist', async () => {
      const card = buildCreditCard();
      const checking = buildCheckingAccount();
      accountRepo.findById.mockResolvedValueOnce(card);
      accountRepo.findById.mockResolvedValueOnce(checking);
      transactionsService.findWithFilters.mockResolvedValueOnce([
        { type: TransactionType.EXPENSE, isPayment: false, amount: 10000 },
      ]);

      categoriesService.findByType.mockResolvedValue([]);
      const newCategory = {
        _id: makeId(),
        name: 'Pagamento de Fatura',
        type: 'expense',
      };
      categoriesService.create.mockResolvedValue(newCategory);
      transactionsService.create.mockResolvedValue({});

      await service.payInvoice(
        card._id.toString(),
        checking._id.toString(),
        2026,
        5
      );

      expect(categoriesService.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Pagamento de Fatura' })
      );
    });

    it('should create two transactions (expense on checking, income on card) with correct amount', async () => {
      const card = buildCreditCard({
        creditLimit: 100000,
        initialBalance: 60000,
      });
      // month has 40000 cents in expenses → invoiceAmount = 40000 / 100 = 400
      const checking = buildCheckingAccount();
      accountRepo.findById.mockResolvedValueOnce(card);
      accountRepo.findById.mockResolvedValueOnce(checking);
      transactionsService.findWithFilters.mockResolvedValueOnce([
        { type: TransactionType.EXPENSE, isPayment: false, amount: 40000 },
      ]);

      const category = {
        _id: makeId(),
        name: 'Pagamento de Fatura',
        type: 'expense',
      };
      categoriesService.findByType.mockResolvedValue([category]);
      transactionsService.create.mockResolvedValue({});

      const result = await service.payInvoice(
        card._id.toString(),
        checking._id.toString(),
        2026,
        5
      );

      expect(transactionsService.create).toHaveBeenCalledTimes(2);

      const calls = transactionsService.create.mock.calls;
      const expenseTx = calls[0][0];
      const incomeTx = calls[1][0];

      // First call: expense on checking account
      expect(expenseTx.type).toBe(TransactionType.EXPENSE);
      expect(expenseTx.account).toBe(checking._id.toString());
      expect(expenseTx.amount).toBe(400);
      expect(expenseTx.status).toBe(TransactionStatus.PAID);
      expect(expenseTx.isPayment).toBe(true);

      // Second call: income on credit card (bypass flag = true)
      expect(incomeTx.type).toBe(TransactionType.INCOME);
      expect(incomeTx.account).toBe(card._id.toString());
      expect(incomeTx.amount).toBe(400);
      expect(calls[1][1]).toBe(true); // byPassCreditInvoiceCheck

      expect(result.invoiceAmount).toBe(400);
      expect(result.creditCardName).toBe(card.name);
      expect(result.checkingAccountName).toBe(checking.name);
    });
  });
});

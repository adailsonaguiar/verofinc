import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import {
  TransactionType,
  TransactionStatus,
} from '../../entities/transaction.entity';
import { Types } from 'mongoose';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let transactionsService: {
    create: Mock;
    findWithFilters: Mock;
    getAvailableMonths: Mock;
    findOne: Mock;
    update: Mock;
    remove: Mock;
  };

  const makeId = () => new Types.ObjectId().toString();

  const makeTx = (overrides: any = {}) => ({
    _id: makeId(),
    description: 'Aluguel',
    amount: 150000,
    date: new Date('2026-05-01'),
    type: TransactionType.EXPENSE,
    status: TransactionStatus.PAID,
    account: makeId(),
    ...overrides,
  });

  beforeEach(async () => {
    transactionsService = {
      create: vi.fn(),
      findWithFilters: vi.fn(),
      getAvailableMonths: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        { provide: TransactionsService, useValue: transactionsService },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // POST /transactions
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should delegate to transactionsService.create and return the result', async () => {
      const dto: any = {
        description: 'Salário',
        amount: 5000,
        date: '2026-05-01',
        type: TransactionType.INCOME,
        categoryId: makeId(),
        status: TransactionStatus.PAID,
        account: makeId(),
      };
      const created = makeTx(dto);
      transactionsService.create.mockResolvedValue(created);

      const result = await controller.create(dto);

      expect(transactionsService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(created);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /transactions
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    it('should call findWithFilters with an empty object when no query params are provided', async () => {
      const txs = [makeTx()];
      transactionsService.findWithFilters.mockResolvedValue(txs);

      const result = await controller.findAll();

      expect(transactionsService.findWithFilters).toHaveBeenCalledWith({});
      expect(result).toEqual(txs);
    });

    it('should forward type, account and status filters', async () => {
      transactionsService.findWithFilters.mockResolvedValue([]);

      await controller.findAll(
        'expense',
        undefined,
        'paid',
        undefined,
        undefined,
        undefined,
        undefined,
        'acc-id'
      );

      const filters = transactionsService.findWithFilters.mock.calls[0][0];
      expect(filters.type).toBe('expense');
      expect(filters.status).toBe('paid');
      expect(filters.account).toBe('acc-id');
    });

    it('should parse year and month as integers', async () => {
      transactionsService.findWithFilters.mockResolvedValue([]);

      await controller.findAll(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        '2026',
        '5'
      );

      const filters = transactionsService.findWithFilters.mock.calls[0][0];
      expect(filters.year).toBe(2026);
      expect(filters.month).toBe(5);
    });

    it('should forward startDate and endDate when both are provided', async () => {
      transactionsService.findWithFilters.mockResolvedValue([]);

      await controller.findAll(
        undefined,
        undefined,
        undefined,
        '2026-05-01',
        '2026-05-31'
      );

      const filters = transactionsService.findWithFilters.mock.calls[0][0];
      expect(filters.startDate).toBe('2026-05-01');
      expect(filters.endDate).toBe('2026-05-31');
    });

    it('should set withCreditCardFilter=true when query param is "true"', async () => {
      transactionsService.findWithFilters.mockResolvedValue([]);

      await controller.findAll(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'true'
      );

      const filters = transactionsService.findWithFilters.mock.calls[0][0];
      expect(filters.withCreditCardFilter).toBe(true);
    });

    it('should forward description filter when provided', async () => {
      transactionsService.findWithFilters.mockResolvedValue([]);

      await controller.findAll(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'aluguel'
      );

      const filters = transactionsService.findWithFilters.mock.calls[0][0];
      expect(filters.description).toBe('aluguel');
    });

    it('should not include year/month in filters when only one of them is provided', async () => {
      transactionsService.findWithFilters.mockResolvedValue([]);

      await controller.findAll(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        '2026',
        undefined
      );

      const filters = transactionsService.findWithFilters.mock.calls[0][0];
      expect(filters.year).toBeUndefined();
      expect(filters.month).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // GET /transactions/available-months
  // ---------------------------------------------------------------------------
  describe('getAvailableMonths', () => {
    it('should delegate to transactionsService.getAvailableMonths', async () => {
      const months = [{ year: 2026, month: 5 }];
      transactionsService.getAvailableMonths.mockResolvedValue(months);

      const result = await controller.getAvailableMonths();

      expect(transactionsService.getAvailableMonths).toHaveBeenCalledTimes(1);
      expect(result).toEqual(months);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /transactions/:id
  // ---------------------------------------------------------------------------
  describe('findOne', () => {
    it('should return the transaction with the given id', async () => {
      const id = makeId();
      const tx = makeTx({ _id: id });
      transactionsService.findOne.mockResolvedValue(tx);

      const result = await controller.findOne(id);

      expect(transactionsService.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(tx);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /transactions/:id
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should delegate to transactionsService.update and return the result', async () => {
      const id = makeId();
      const dto: any = { description: 'Updated', amount: 300 };
      const updated = makeTx({
        _id: id,
        description: 'Updated',
        amount: 30000,
      });
      transactionsService.update.mockResolvedValue(updated);

      const result = await controller.update(id, dto);

      expect(transactionsService.update).toHaveBeenCalledWith(id, dto);
      expect(result).toEqual(updated);
    });

    it('should accept isFixed=true in the update payload', async () => {
      const id = makeId();
      const dto: any = {
        description: 'MARIA LUCA PEREIA',
        amount: 7,
        date: '2026-05-01',
        type: TransactionType.EXPENSE,
        categoryId: makeId(),
        status: TransactionStatus.PAID,
        account: makeId(),
        isFixed: true,
      };
      const updated = makeTx({ _id: id, ...dto, isFixed: true });
      transactionsService.update.mockResolvedValue(updated);

      const result = await controller.update(id, dto);

      expect(transactionsService.update).toHaveBeenCalledWith(id, dto);
      expect(result.isFixed).toBe(true);
    });

    it('should accept isFixed=false in the update payload', async () => {
      const id = makeId();
      const dto: any = {
        description: 'MARIA LUCA PEREIA',
        amount: 7,
        date: '2026-05-01',
        type: TransactionType.EXPENSE,
        categoryId: makeId(),
        status: TransactionStatus.PAID,
        account: makeId(),
        isFixed: false,
      };
      const updated = makeTx({ _id: id, ...dto, isFixed: false });
      transactionsService.update.mockResolvedValue(updated);

      const result = await controller.update(id, dto);

      expect(transactionsService.update).toHaveBeenCalledWith(id, dto);
      expect(result.isFixed).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /transactions/:id
  // ---------------------------------------------------------------------------
  describe('remove', () => {
    it('should delegate to transactionsService.remove', async () => {
      const id = makeId();
      transactionsService.remove.mockResolvedValue(undefined);

      await controller.remove(id);

      expect(transactionsService.remove).toHaveBeenCalledWith(id);
    });
  });
});

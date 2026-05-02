import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { TransactionRepository } from './transaction.repository';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../entities/transaction.entity';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('TransactionRepository', () => {
  let repository: TransactionRepository;

  // chainable query helper
  const withChain = (value: any) => ({
    populate: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue(value),
  });

  let mockSave: any;
  let MockModel: any;

  const makeId = () => new Types.ObjectId();

  const makeTx = (overrides: any = {}) => ({
    _id: makeId(),
    description: 'Aluguel',
    amount: 150000,
    date: new Date(2026, 4, 15, 12, 0, 0), // local noon — timezone-safe
    type: TransactionType.EXPENSE,
    status: TransactionStatus.PAID,
    account: makeId(),
    category: makeId(),
    ...overrides,
  });

  beforeEach(async () => {
    mockSave = vi.fn();

    MockModel = vi.fn(function (this: any, data: any) {
      Object.assign(this, data);
      this.save = mockSave;
    });
    MockModel.find = vi.fn();
    MockModel.findById = vi.fn();
    MockModel.findByIdAndUpdate = vi.fn();
    MockModel.findByIdAndDelete = vi.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionRepository,
        { provide: getModelToken(Transaction.name), useValue: MockModel },
      ],
    }).compile();

    repository = module.get<TransactionRepository>(TransactionRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should instantiate model with given data and call save()', async () => {
      const data = {
        description: 'Salário',
        amount: 500000,
        date: new Date(),
        type: TransactionType.INCOME,
        status: TransactionStatus.PAID,
      };
      const saved = makeTx(data);
      mockSave.mockResolvedValue(saved);

      const result = await repository.create(data);

      expect(MockModel).toHaveBeenCalledWith(data);
      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(result).toEqual(saved);
    });
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    it('should call find with no filter by default and populate category', async () => {
      const txs = [makeTx()];
      MockModel.find.mockReturnValue(withChain(txs));

      const result = await repository.findAll();

      expect(MockModel.find).toHaveBeenCalledWith({});
      expect(result).toEqual(txs);
    });

    it('should pass additional filter to find', async () => {
      const txs = [makeTx({ type: TransactionType.INCOME })];
      MockModel.find.mockReturnValue(withChain(txs));

      await repository.findAll({ type: TransactionType.INCOME });

      expect(MockModel.find).toHaveBeenCalledWith({
        type: TransactionType.INCOME,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // findById
  // ---------------------------------------------------------------------------
  describe('findById', () => {
    it('should call findById and return the transaction', async () => {
      const tx = makeTx();
      MockModel.findById.mockReturnValue(withChain(tx));

      const result = await repository.findById(tx._id.toString());

      expect(MockModel.findById).toHaveBeenCalledWith(tx._id.toString());
      expect(result).toEqual(tx);
    });

    it('should return null when not found', async () => {
      MockModel.findById.mockReturnValue(withChain(null));

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should call findByIdAndUpdate with {new: true}', async () => {
      const id = makeId().toString();
      const updated = makeTx({ description: 'Updated' });
      MockModel.findByIdAndUpdate.mockReturnValue(withChain(updated));

      const result = await repository.update(id, { description: 'Updated' });

      expect(MockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        { description: 'Updated' },
        { new: true }
      );
      expect(result).toEqual(updated);
    });
  });

  // ---------------------------------------------------------------------------
  // delete
  // ---------------------------------------------------------------------------
  describe('delete', () => {
    it('should call findByIdAndDelete and return the deleted transaction', async () => {
      const id = makeId().toString();
      const deleted = makeTx();
      MockModel.findByIdAndDelete.mockReturnValue(withChain(deleted));

      const result = await repository.delete(id);

      expect(MockModel.findByIdAndDelete).toHaveBeenCalledWith(id);
      expect(result).toEqual(deleted);
    });
  });

  // ---------------------------------------------------------------------------
  // findWithFilters
  // ---------------------------------------------------------------------------
  describe('findWithFilters', () => {
    it('should build an empty query when no filters are provided', async () => {
      const txs = [makeTx()];
      MockModel.find.mockReturnValue(withChain(txs));

      await repository.findWithFilters({});

      const queryCalled = MockModel.find.mock.calls[0][0];
      expect(queryCalled).toEqual({});
    });

    it('should add type filter when provided', async () => {
      MockModel.find.mockReturnValue(withChain([]));

      await repository.findWithFilters({ type: TransactionType.INCOME });

      const q = MockModel.find.mock.calls[0][0];
      expect(q.type).toBe(TransactionType.INCOME);
    });

    it('should add account filter when provided', async () => {
      const accId = makeId().toString();
      MockModel.find.mockReturnValue(withChain([]));

      await repository.findWithFilters({ account: accId });

      const q = MockModel.find.mock.calls[0][0];
      expect(q.account).toBe(accId);
    });

    it('should add status filter when provided', async () => {
      MockModel.find.mockReturnValue(withChain([]));

      await repository.findWithFilters({ status: TransactionStatus.UNPAID });

      const q = MockModel.find.mock.calls[0][0];
      expect(q.status).toBe(TransactionStatus.UNPAID);
    });

    it('should add description regex filter when provided', async () => {
      MockModel.find.mockReturnValue(withChain([]));

      await repository.findWithFilters({ description: 'alug' });

      const q = MockModel.find.mock.calls[0][0];
      expect(q.description).toEqual({ $regex: 'alug', $options: 'i' });
    });

    it('should add date range when year and month are provided', async () => {
      MockModel.find.mockReturnValue(withChain([]));

      await repository.findWithFilters({ year: 2026, month: 5 });

      const q = MockModel.find.mock.calls[0][0];
      expect(q.date.$gte).toEqual(new Date(Date.UTC(2026, 4, 1, 0, 0, 0, 0)));
      expect(q.date.$lte).toEqual(
        new Date(Date.UTC(2026, 5, 0, 23, 59, 59, 999))
      );
    });

    it('should add startDate/endDate range filter when provided', async () => {
      MockModel.find.mockReturnValue(withChain([]));
      const start = '2026-05-01';
      const end = '2026-05-31';

      await repository.findWithFilters({ startDate: start, endDate: end });

      const q = MockModel.find.mock.calls[0][0];
      expect(q.date.$gte).toEqual(new Date(start));
      expect(q.date.$lte).toEqual(new Date(end));
    });

    it('should add valid ObjectId category filter', async () => {
      const catId = makeId().toString();
      MockModel.find.mockReturnValue(withChain([]));

      await repository.findWithFilters({ category: catId });

      const q = MockModel.find.mock.calls[0][0];
      expect(q.category).toBeInstanceOf(Types.ObjectId);
      expect(q.category.toString()).toBe(catId);
    });
  });

  // ---------------------------------------------------------------------------
  // getAvailableMonths
  // ---------------------------------------------------------------------------
  describe('getAvailableMonths', () => {
    it('should return unique year-month pairs sorted descending', async () => {
      // Use local noon dates to avoid UTC midnight timezone shifting the month
      const txs = [
        { date: new Date(2026, 2, 15, 12, 0, 0) }, // local March 15
        { date: new Date(2026, 4, 1, 12, 0, 0) }, // local May 1
        { date: new Date(2026, 2, 20, 12, 0, 0) }, // local March 20 (duplicate month)
      ];
      MockModel.find.mockReturnValue(withChain(txs));

      const result = await repository.getAvailableMonths();

      expect(result).toHaveLength(2);
      // descending: May before March
      expect(result[0]).toEqual({ year: 2026, month: 5 });
      expect(result[1]).toEqual({ year: 2026, month: 3 });
    });

    it('should return empty array when there are no transactions', async () => {
      MockModel.find.mockReturnValue(withChain([]));

      const result = await repository.getAvailableMonths();

      expect(result).toEqual([]);
    });
  });
});

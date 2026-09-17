import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { LedgerRepository } from './ledger.repository';
import { Ledger, LedgerOperationType } from '../entities/ledger.entity';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('LedgerRepository', () => {
  let repository: LedgerRepository;

  // Helper to create a chainable mock: .populate().sort().exec()
  const withChain = (value: any) => {
    const chain = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(value),
    };
    return chain;
  };

  let mockSave: any;
  let MockModel: any;

  const makeId = () => new Types.ObjectId();

  const makeLedger = (overrides: any = {}) => ({
    _id: makeId(),
    operationType: LedgerOperationType.CREATE,
    value: 5000,
    accountId: makeId(),
    operationDate: new Date(),
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LedgerRepository,
        { provide: getModelToken(Ledger.name), useValue: MockModel },
      ],
    }).compile();

    repository = module.get<LedgerRepository>(LedgerRepository);
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
        operationType: LedgerOperationType.CREATE,
        value: 1000,
        accountId: makeId(),
      };
      const saved = makeLedger(data);
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
    it('should call find with populate and sort and return results', async () => {
      const entries = [makeLedger(), makeLedger()];
      MockModel.find.mockReturnValue(withChain(entries));

      const result = await repository.findAll();

      expect(MockModel.find).toHaveBeenCalledWith();
      expect(result).toEqual(entries);
    });
  });

  // ---------------------------------------------------------------------------
  // findById
  // ---------------------------------------------------------------------------
  describe('findById', () => {
    it('should call findById and return the ledger entry', async () => {
      const id = makeId().toString();
      const entry = makeLedger();
      MockModel.findById.mockReturnValue(withChain(entry));

      const result = await repository.findById(id);

      expect(MockModel.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(entry);
    });

    it('should return null when ledger entry is not found', async () => {
      MockModel.findById.mockReturnValue(withChain(null));

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // findByTransactionId
  // ---------------------------------------------------------------------------
  describe('findByTransactionId', () => {
    it('should call find with {transactionId} filter', async () => {
      const txId = makeId().toString();
      const entries = [makeLedger()];
      MockModel.find.mockReturnValue(withChain(entries));

      const result = await repository.findByTransactionId(txId);

      expect(MockModel.find).toHaveBeenCalledWith({ transactionId: txId });
      expect(result).toEqual(entries);
    });
  });

  // ---------------------------------------------------------------------------
  // findByOperationType
  // ---------------------------------------------------------------------------
  describe('findByOperationType', () => {
    it('should call find with {operationType} filter', async () => {
      const entries = [
        makeLedger({ operationType: LedgerOperationType.UPDATE }),
      ];
      MockModel.find.mockReturnValue(withChain(entries));

      const result = await repository.findByOperationType(
        LedgerOperationType.UPDATE
      );

      expect(MockModel.find).toHaveBeenCalledWith({
        operationType: LedgerOperationType.UPDATE,
      });
      expect(result).toEqual(entries);
    });
  });

  // ---------------------------------------------------------------------------
  // findByDateRange
  // ---------------------------------------------------------------------------
  describe('findByDateRange', () => {
    it('should call find with date range filter', async () => {
      const start = new Date('2026-01-01');
      const end = new Date('2026-01-31');
      const entries = [makeLedger()];
      MockModel.find.mockReturnValue(withChain(entries));

      const result = await repository.findByDateRange(start, end);

      expect(MockModel.find).toHaveBeenCalledWith({
        operationDate: { $gte: start, $lte: end },
      });
      expect(result).toEqual(entries);
    });
  });
});

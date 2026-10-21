import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ExportService } from './export.service';

describe('ExportService', () => {
  let service: ExportService;
  let listCollectionsToArray: ReturnType<typeof vi.fn>;
  let db: {
    listCollections: ReturnType<typeof vi.fn>;
    collection: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    listCollectionsToArray = vi.fn();

    db = {
      listCollections: vi.fn(() => ({ toArray: listCollectionsToArray })),
      collection: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportService,
        { provide: getConnectionToken(), useValue: { db } },
      ],
    }).compile();

    service = module.get<ExportService>(ExportService);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should export all collections except users and system collections', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-21T12:00:00.000Z'));

    const transactions = [{ _id: 'tx-1', amount: 1000 }];
    const accounts = [{ _id: 'acc-1', name: 'Conta Corrente' }];
    const documentsByCollection: Record<string, unknown[]> = {
      accounts,
      budgets: [],
      transactions,
    };

    listCollectionsToArray.mockResolvedValue([
      { name: 'transactions' },
      { name: 'accounts' },
      { name: 'users' },
      { name: 'system.indexes' },
      { name: 'budgets' },
    ]);
    db.collection.mockImplementation((name: string) => ({
      find: vi.fn(() => ({
        toArray: vi.fn().mockResolvedValue(documentsByCollection[name]),
      })),
    }));

    const result = await service.exportAll();

    expect(db.collection).toHaveBeenCalledTimes(3);
    expect(db.collection).toHaveBeenNthCalledWith(1, 'accounts');
    expect(db.collection).toHaveBeenNthCalledWith(2, 'budgets');
    expect(db.collection).toHaveBeenNthCalledWith(3, 'transactions');
    expect(db.collection).not.toHaveBeenCalledWith('users');
    expect(db.collection).not.toHaveBeenCalledWith('system.indexes');
    expect(result).toEqual({
      exportedAt: '2026-10-21T12:00:00.000Z',
      collections: {
        accounts,
        budgets: [],
        transactions,
      },
    });
  });

  it('should return an empty collections object when there are no collections', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-21T12:00:00.000Z'));
    listCollectionsToArray.mockResolvedValue([]);

    const result = await service.exportAll();

    expect(result).toEqual({
      exportedAt: '2026-10-21T12:00:00.000Z',
      collections: {},
    });
    expect(db.collection).not.toHaveBeenCalled();
  });

  it('should propagate database errors', async () => {
    listCollectionsToArray.mockRejectedValue(new Error('database unavailable'));

    await expect(service.exportAll()).rejects.toThrow('database unavailable');
  });
});

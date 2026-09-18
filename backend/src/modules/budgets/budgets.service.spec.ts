import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { BudgetsService } from './budgets.service';
import { BudgetRepository } from '../../repositories/budget.repository';
import { CategoriesService } from '../categories/categories.service';
import { TransactionsService } from '../transactions/transactions.service';
import { CategoryType } from '../../entities/category.entity';
import { TransactionType } from '../../entities/transaction.entity';

describe('BudgetsService', () => {
  let service: BudgetsService;
  let budgetRepo: {
    upsert: Mock;
    findByMonth: Mock;
    remove: Mock;
  };
  let categoriesService: { findByType: Mock; findOne: Mock };
  let transactionsService: { findByMonth: Mock };

  beforeEach(async () => {
    budgetRepo = {
      upsert: vi.fn(),
      findByMonth: vi.fn(),
      remove: vi.fn(),
    };
    categoriesService = {
      findByType: vi.fn(),
      findOne: vi.fn(),
    };
    transactionsService = {
      findByMonth: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        { provide: BudgetRepository, useValue: budgetRepo },
        { provide: CategoriesService, useValue: categoriesService },
        { provide: TransactionsService, useValue: transactionsService },
      ],
    }).compile();

    service = module.get<BudgetsService>(BudgetsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverview', () => {
    const catA = { _id: new Types.ObjectId(), name: 'Alimentação' };
    const catB = { _id: new Types.ObjectId(), name: 'Transporte' };

    it('should aggregate spent per category and expose the total limit', async () => {
      budgetRepo.findByMonth.mockResolvedValue([
        { category: null, limit: 500000 },
        { category: catA._id, limit: 200000 },
      ]);
      categoriesService.findByType.mockResolvedValue([catA, catB]);
      transactionsService.findByMonth.mockResolvedValue([
        {
          type: TransactionType.EXPENSE,
          amount: 150000,
          category: catA,
          isReversal: false,
          isPayment: false,
        },
        {
          type: TransactionType.EXPENSE,
          amount: 80000,
          category: catB,
          isReversal: false,
          isPayment: false,
        },
        {
          type: TransactionType.INCOME,
          amount: 100000,
          category: catA,
          isReversal: false,
          isPayment: false,
        },
        {
          type: TransactionType.EXPENSE,
          amount: 999999,
          category: catA,
          isReversal: true,
          isPayment: false,
        },
        {
          type: TransactionType.EXPENSE,
          amount: 50000,
          category: catA,
          isReversal: false,
          isPayment: true,
        },
      ]);

      const result = await service.getOverview('2026-09');

      expect(result.totalLimit).toBe(500000);
      expect(result.totalSpent).toBe(230000);
      expect(result.items).toEqual([
        { category: catA, limit: 200000, spent: 150000 },
        { category: catB, limit: null, spent: 80000 },
      ]);
      expect(transactionsService.findByMonth).toHaveBeenCalledWith(2026, 9);
      expect(categoriesService.findByType).toHaveBeenCalledWith(
        CategoryType.EXPENSE
      );
    });

    it('should default to the current month when none is provided', async () => {
      budgetRepo.findByMonth.mockResolvedValue([]);
      categoriesService.findByType.mockResolvedValue([]);
      transactionsService.findByMonth.mockResolvedValue([]);

      const result = await service.getOverview();

      const now = new Date();
      const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      expect(result.month).toBe(expected);
    });

    it('should throw BadRequestException on an invalid month', async () => {
      await expect(service.getOverview('2026-13')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('upsert', () => {
    it('should convert reais to cents and upsert a category budget', async () => {
      const cat = { _id: new Types.ObjectId(), type: CategoryType.EXPENSE };
      categoriesService.findOne.mockResolvedValue(cat);
      budgetRepo.upsert.mockResolvedValue({ limit: 12345 });

      await service.upsert({
        month: '2026-09',
        categoryId: cat._id.toString(),
        limit: 123.45,
      });

      expect(budgetRepo.upsert).toHaveBeenCalledWith(
        '2026-09',
        expect.any(Types.ObjectId),
        12345
      );
    });

    it('should upsert a total budget when no category is provided', async () => {
      budgetRepo.upsert.mockResolvedValue({ limit: 100000 });

      await service.upsert({ month: '2026-09', limit: 1000 });

      expect(budgetRepo.upsert).toHaveBeenCalledWith('2026-09', null, 100000);
    });

    it('should reject a non-expense category', async () => {
      const cat = { _id: new Types.ObjectId(), type: CategoryType.INCOME };
      categoriesService.findOne.mockResolvedValue(cat);

      await expect(
        service.upsert({
          month: '2026-09',
          categoryId: cat._id.toString(),
          limit: 100,
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should throw when the limit does not exist', async () => {
      budgetRepo.remove.mockResolvedValue(null);

      await expect(service.remove('2026-09')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should remove a category limit', async () => {
      const catId = new Types.ObjectId();
      budgetRepo.remove.mockResolvedValue({ category: catId });

      await service.remove('2026-09', catId.toString());

      expect(budgetRepo.remove).toHaveBeenCalledWith(
        '2026-09',
        expect.any(Types.ObjectId)
      );
    });
  });
});

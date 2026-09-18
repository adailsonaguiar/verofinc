import { BadRequestException, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { BudgetRepository } from '../../repositories/budget.repository';
import { UpsertBudgetDto } from './dto/upsert-budget.dto';
import { CategoriesService } from '../categories/categories.service';
import { TransactionsService } from '../transactions/transactions.service';
import { CategoryType } from '../../entities/category.entity';
import { TransactionType } from '../../entities/transaction.entity';

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export interface BudgetCategoryItem {
  category: any;
  limit: number | null;
  spent: number;
}

export interface BudgetOverview {
  month: string;
  totalLimit: number | null;
  totalSpent: number;
  items: BudgetCategoryItem[];
}

@Injectable()
export class BudgetsService {
  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly categoriesService: CategoriesService,
    private readonly transactionsService: TransactionsService
  ) {}

  private currentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private assertValidMonth(month: string): void {
    if (!MONTH_PATTERN.test(month)) {
      throw new BadRequestException('Month must be in YYYY-MM format');
    }
  }

  async getOverview(month?: string): Promise<BudgetOverview> {
    const targetMonth = month || this.currentMonth();
    this.assertValidMonth(targetMonth);

    const [year, monthIndex] = targetMonth.split('-').map(Number);

    const [budgets, categories, transactions] = await Promise.all([
      this.budgetRepository.findByMonth(targetMonth),
      this.categoriesService.findByType(CategoryType.EXPENSE),
      this.transactionsService.findByMonth(year, monthIndex),
    ]);

    const spentByCategory = new Map<string, number>();
    let totalSpent = 0;

    for (const tx of transactions) {
      if (
        tx.type !== TransactionType.EXPENSE ||
        (tx as any).isReversal ||
        (tx as any).isPayment
      ) {
        continue;
      }
      const categoryId = ((tx.category as any)?._id ?? tx.category)?.toString();
      if (!categoryId) continue;

      const amount = tx.amount || 0;
      spentByCategory.set(
        categoryId,
        (spentByCategory.get(categoryId) ?? 0) + amount
      );
      totalSpent += amount;
    }

    const limitByCategory = new Map<string, number>();
    let totalLimit: number | null = null;

    for (const budget of budgets) {
      if (budget.category) {
        limitByCategory.set(budget.category.toString(), budget.limit);
      } else {
        totalLimit = budget.limit;
      }
    }

    const items: BudgetCategoryItem[] = categories.map((category) => ({
      category,
      limit: limitByCategory.get((category as any)._id.toString()) ?? null,
      spent: spentByCategory.get((category as any)._id.toString()) ?? 0,
    }));

    return { month: targetMonth, totalLimit, totalSpent, items };
  }

  async upsert(dto: UpsertBudgetDto) {
    this.assertValidMonth(dto.month);

    let category: Types.ObjectId | null = null;
    if (dto.categoryId) {
      const found = await this.categoriesService.findOne(dto.categoryId);
      if (found.type !== CategoryType.EXPENSE) {
        throw new BadRequestException(
          'Only expense categories can have a budget'
        );
      }
      category = new Types.ObjectId((found as any)._id);
    }

    const limitCents = Math.round(dto.limit * 100);
    return this.budgetRepository.upsert(dto.month, category, limitCents);
  }

  async remove(month: string, categoryId?: string) {
    this.assertValidMonth(month);

    const category = categoryId ? new Types.ObjectId(categoryId) : null;
    const removed = await this.budgetRepository.remove(month, category);

    if (!removed) {
      throw new BadRequestException('Budget limit not found');
    }

    return removed;
  }
}

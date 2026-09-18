import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BudgetsService } from './budgets.service';
import { BudgetsController } from './budgets.controller';
import { Budget, BudgetSchema } from '../../entities/budget.entity';
import { BudgetRepository } from '../../repositories/budget.repository';
import { CategoriesModule } from '../categories/categories.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Budget.name, schema: BudgetSchema }]),
    CategoriesModule,
    TransactionsModule,
  ],
  controllers: [BudgetsController],
  providers: [BudgetsService, BudgetRepository],
})
export class BudgetsModule {}

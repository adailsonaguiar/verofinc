import {
  Body,
  Controller,
  Delete,
  Get,
  Put,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { UpsertBudgetDto } from './dto/upsert-budget.dto';

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  getOverview(@Query('month') month?: string) {
    return this.budgetsService.getOverview(month);
  }

  @Put()
  upsert(@Body(ValidationPipe) upsertBudgetDto: UpsertBudgetDto) {
    return this.budgetsService.upsert(upsertBudgetDto);
  }

  @Delete()
  remove(
    @Query('month') month: string,
    @Query('categoryId') categoryId?: string
  ) {
    return this.budgetsService.remove(month, categoryId);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(@Body(ValidationPipe) createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(createTransactionDto);
  }

  @Get()
  findAll(
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('account') account?: string,
    @Query('description') description?: string,
    @Query('withCreditCardFilter') withCreditCardFilter?: string,
  ) {
    // Monta objeto de filtros
    const filters: any = {};
    if (type) filters.type = type;
    if (category) filters.category = category;
    if (account) filters.account = account;
    if (status) filters.status = status;
    if (description) filters.description = description;
    if (withCreditCardFilter) filters.withCreditCardFilter = withCreditCardFilter === 'true';
    if (year && month) {
      filters.year = parseInt(year);
      filters.month = parseInt(month);
    }
    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }
    return this.transactionsService.findWithFilters(filters);
  }

  @Get('available-months')
  getAvailableMonths() {
    return this.transactionsService.getAvailableMonths();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(id, updateTransactionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transactionsService.remove(id);
  }
}

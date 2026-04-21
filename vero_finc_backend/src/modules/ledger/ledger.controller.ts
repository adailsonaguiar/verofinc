import { Controller, Get, Param, Query } from '@nestjs/common';
import { LedgerService } from './ledger.service';

@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get()
  findAll(
    @Query('operationType') operationType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    if (operationType) {
      return this.ledgerService.findByOperationType(operationType);
    }
    if (startDate && endDate) {
      return this.ledgerService.findByDateRange(startDate, endDate);
    }
    return this.ledgerService.findAll();
  }

  @Get('transaction/:transactionId')
  findByTransactionId(@Param('transactionId') transactionId: string) {
    return this.ledgerService.findByTransactionId(transactionId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ledgerService.findOne(id);
  }
}

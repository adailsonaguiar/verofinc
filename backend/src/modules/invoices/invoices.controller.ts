import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  findAll(@Query('account') account?: string) {
    if (account) {
      return this.invoicesService.listByAccount(account);
    }
    return [];
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findById(id);
  }

  @Post(':id/close')
  close(@Param('id') id: string) {
    return this.invoicesService.close(id);
  }
}

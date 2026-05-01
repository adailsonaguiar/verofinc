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
import { Account } from '../../entities/account.entity';
import { AccountService } from './account.service';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountService: AccountService) {}
  @Post()
  create(@Body(ValidationPipe) body: Partial<Account>) {
    return this.accountService.create(body);
  }

  @Get()
  findAll(@Query('type') type?: string) {
    if (type) {
      return this.accountService.findByType(type);
    }
    return this.accountService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) body: Partial<Account>
  ) {
    return this.accountService.update(id, body, true);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accountService.delete(id);
  }

  @Post('pay-invoice')
  payInvoice(
    @Body('creditCardId') creditCardId: string,
    @Body('checkingAccountId') checkingAccountId: string
  ) {
    return this.accountService.payInvoice(creditCardId, checkingAccountId);
  }
}

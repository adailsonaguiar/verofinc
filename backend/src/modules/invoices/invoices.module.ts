import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { Invoice, InvoiceSchema } from '../../entities/invoice.entity';
import {
  Transaction,
  TransactionSchema,
} from '../../entities/transaction.entity';
import { Account, AccountSchema } from '../../entities/account.entity';
import { InvoiceRepository } from '../../repositories/invoice.repository';
import { AccountRepository } from '../../repositories/account.repository';
import { TransactionRepository } from '../../repositories/transaction.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Account.name, schema: AccountSchema },
    ]),
  ],
  controllers: [InvoicesController],
  providers: [
    InvoicesService,
    InvoiceRepository,
    AccountRepository,
    TransactionRepository,
  ],
  exports: [InvoicesService, InvoiceRepository],
})
export class InvoicesModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { Invoice, InvoiceSchema } from '../../entities/invoice.entity';
import {
  Transaction,
  TransactionSchema,
} from '../../entities/transaction.entity';
import { InvoiceRepository } from '../../repositories/invoice.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoiceRepository],
  exports: [InvoicesService, InvoiceRepository],
})
export class InvoicesModule {}

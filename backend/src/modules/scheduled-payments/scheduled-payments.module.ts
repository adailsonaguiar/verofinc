import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Account, AccountSchema } from '../../entities/account.entity';
import {
  ScheduledPayment,
  ScheduledPaymentSchema,
} from '../../entities/scheduled-payment.entity';
import { AccountRepository } from '../../repositories/account.repository';
import { ScheduledPaymentRepository } from '../../repositories/scheduled-payment.repository';
import { TransactionsModule } from '../transactions/transactions.module';
import { ScheduledPaymentsController } from './scheduled-payments.controller';
import { ScheduledPaymentsService } from './scheduled-payments.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ScheduledPayment.name, schema: ScheduledPaymentSchema },
      { name: Account.name, schema: AccountSchema },
    ]),
    TransactionsModule,
  ],
  controllers: [ScheduledPaymentsController],
  providers: [
    ScheduledPaymentsService,
    ScheduledPaymentRepository,
    AccountRepository,
  ],
  exports: [ScheduledPaymentsService],
})
export class ScheduledPaymentsModule {}

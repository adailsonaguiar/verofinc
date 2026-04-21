import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import {
  Transaction,
  TransactionSchema,
} from '../../entities/transaction.entity';
import { TransactionRepository } from '../../repositories/transaction.repository';
import { AccountRepository } from '../../repositories/account.repository';
import { Account, AccountSchema } from '../../entities/account.entity';

import { AccountsModule } from '../accounts/accounts.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: Account.name, schema: AccountSchema },
    ]),
    forwardRef(() => AccountsModule),
    LedgerModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionRepository, AccountRepository],
  exports: [TransactionsService],
})
export class TransactionsModule {}

import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Account, AccountSchema } from '../../entities/account.entity';
import { AccountRepository } from '../../repositories/account.repository';
import { AccountsController } from './accounts.controller';
import { AccountService } from './account.service';
import { TransactionsModule } from '../transactions/transactions.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }]),
    forwardRef(() => TransactionsModule),
    CategoriesModule,
  ],
  controllers: [AccountsController],
  providers: [AccountRepository, AccountService],
  exports: [AccountRepository, AccountService],
})
export class AccountsModule {}

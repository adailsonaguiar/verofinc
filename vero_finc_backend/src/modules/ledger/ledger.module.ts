import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LedgerService } from './ledger.service';
import { LedgerController } from './ledger.controller';
import { Ledger, LedgerSchema } from '../../entities/ledger.entity';
import { LedgerRepository } from '../../repositories/ledger.repository';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Ledger.name, schema: LedgerSchema }]),
    forwardRef(() => AccountsModule),
  ],
  controllers: [LedgerController],
  providers: [LedgerService, LedgerRepository],
  exports: [LedgerService],
})
export class LedgerModule {}

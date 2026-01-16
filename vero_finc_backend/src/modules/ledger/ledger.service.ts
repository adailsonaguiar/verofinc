import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { LedgerRepository } from '../../repositories/ledger.repository';
import { Ledger, LedgerOperationType } from '../../entities/ledger.entity';
import { AccountService } from '../accounts/account.service';

@Injectable()
export class LedgerService {
    constructor(private readonly ledgerRepository: LedgerRepository, private readonly accountService: AccountService) { }

    async create(ledgerData: Partial<Ledger>): Promise<Ledger> {
        return this.ledgerRepository.create(ledgerData);
    }

    async findAll(): Promise<Ledger[]> {
        return this.ledgerRepository.findAll();
    }

    async findOne(id: string): Promise<Ledger> {
        const ledger = await this.ledgerRepository.findById(id);
        if (!ledger) {
            throw new NotFoundException(`Ledger entry with ID ${id} not found`);
        }
        return ledger;
    }

    async findByTransactionId(transactionId: string): Promise<Ledger[]> {
        return this.ledgerRepository.findByTransactionId(transactionId);
    }

    async findByOperationType(operationType: string): Promise<Ledger[]> {
        return this.ledgerRepository.findByOperationType(operationType);
    }

    async findByDateRange(startDate: string, endDate: string): Promise<Ledger[]> {
        return this.ledgerRepository.findByDateRange(
            new Date(startDate),
            new Date(endDate),
        );
    }

    async updateAccountBalance(accountId: Types.ObjectId, amount: number): Promise<void> {
        const account = await this.accountService.findById(accountId.toString());
        const newBalance = (account.initialBalance || 0) + amount;

        console.log(`account`, account, `amount`, amount, `newBalance`, newBalance);

        if(newBalance < 0) {
            throw new Error(`Insufficient funds in account ID ${accountId.toString()}`);
        }

        await this.accountService.update(accountId.toString(), { initialBalance: newBalance });
    }

    async logOperation(
        operationType: LedgerOperationType,
        value: number,
        accountId: Types.ObjectId,
        description: string,
        transactionId: Types.ObjectId | undefined = undefined,
    ): Promise<Ledger> {
        await this.updateAccountBalance(accountId, value);

        return this.ledgerRepository.create({
            transactionId: transactionId,
            operationType,
            description,
            operationDate: new Date(),
            value,
            accountId,
        });
    }
}

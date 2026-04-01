
import { Injectable, NotFoundException, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { TransactionRepository } from '../../repositories/transaction.repository';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transaction, TransactionStatus, TransactionType } from '../../entities/transaction.entity';
import { LedgerService } from '../ledger/ledger.service';
import { LedgerOperationType } from '../../entities/ledger.entity';
import { AccountRepository } from '../../repositories/account.repository';
import { AccountType } from '@/entities/account.entity';

@Injectable()
export class TransactionsService {
    constructor(
        private readonly transactionRepository: TransactionRepository,
        private readonly ledgerService: LedgerService,
        private readonly accountRepository: AccountRepository,
    ) { }

    private async filterIncomeCreditCardTransactionsToShow(transactions: Transaction[]): Promise<Transaction[]> {
        const accounts = await this.accountRepository.findAll();
        return transactions.filter(tx => {
            const account = accounts.find(acc => (acc as any)._id.toString() === (tx.account as any).toString());
            if (!account) return false;
            if (account.type === AccountType.CREDIT_CARD && tx.type === TransactionType.INCOME) return false;
            return true;
        })
    }

    private sortTransactionsByDate(transactions: Transaction[]): Transaction[] {
        return transactions.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA; // Decrescente (mais recentes primeiro)
        });
    }

    async findWithFilters(filters: any): Promise<Transaction[]> {
        const transactions = await this.transactionRepository.findWithFilters(filters);
        let filtered = transactions;

        if(!filters?.withCreditCardFilter) {
            filtered = await this.filterIncomeCreditCardTransactionsToShow(transactions);
        }

        return this.sortTransactionsByDate(filtered);
    }

    async findByDescription(description: string): Promise<Transaction[]> {
        return this.transactionRepository.findByDescription(description);
    }

    async findByAccount(accountId: string): Promise<Transaction[]> {
        return this.transactionRepository.findByAccount(accountId);
    }

    async create(createTransactionDto: CreateTransactionDto, byPassCreditInvoiceCheck = false): Promise<Transaction> {
        createTransactionDto.amount = createTransactionDto.amount * 100;

        // Buscar conta para validar tipo
        const account = await this.accountRepository.findById(createTransactionDto.account.toString());
        if (!account) {
            throw new NotFoundException(`Account with ID ${createTransactionDto.account} not found`);
        }

        // Validações para cartão de crédito
        if (account.type === 'credit_card') {
            if (createTransactionDto.status === TransactionStatus.UNPAID) {
                throw new BadRequestException('Transações em cartão de crédito não podem ter status pendente');
            }
            if (createTransactionDto.type === TransactionType.INCOME && !byPassCreditInvoiceCheck) {
                throw new BadRequestException('Transações em cartão de crédito não podem ser do tipo receita');
            }
        }

        const transaction: any = {
            description: createTransactionDto.description,
            amount: createTransactionDto.amount,
            date: new Date(createTransactionDto.date),
            type: createTransactionDto.type,
            category: new Types.ObjectId(createTransactionDto.categoryId),
            status: createTransactionDto.status,
            account: createTransactionDto.account,
        };

        if (transaction.status === TransactionStatus.PAID) {
            await this.ledgerService.logOperation(
                LedgerOperationType.CREATE,
                transaction.type  ===  TransactionType.EXPENSE ? -transaction.amount : transaction.amount,
                JSON.parse(JSON.stringify(transaction.account)),
                `Transação criada: ${transaction.description}`,
            );
        }
        
        const created = await this.transactionRepository.create(transaction);

        return created;
    }

    async findAll(): Promise<Transaction[]> {
        return this.transactionRepository.findAll({ isReversal: { $ne: true } });
    }

    async findOne(id: string): Promise<Transaction> {
        const transaction = await this.transactionRepository.findById(id);
        if (!transaction) {
            throw new NotFoundException(`Transaction with ID ${id} not found`);
        }
        return transaction;
    }

    private async handleLedgerUpdatesOnTransactionUpdate(
        original: Transaction,
        updateData: any,
    ): Promise<void> {
        const originalId = (original as any)._id.toString();
        const originalAccount = JSON.parse(JSON.stringify(original.account));

        // Caso 1: PAID -> UNPAID (reverter lançamento)
        if (original.status === TransactionStatus.PAID && updateData.status === TransactionStatus.UNPAID) {
            await this.ledgerService.logOperation(
                LedgerOperationType.UPDATE,
                original.type === TransactionType.EXPENSE ? original.amount : -original.amount,
                originalAccount,
                `Transação atualizada para unpaid: ${updateData.description}`,
                originalId,
            );
            return;
        }

        // Caso 2: PAID -> PAID (atualizar valores)
        if (original.status === TransactionStatus.PAID && updateData.status === TransactionStatus.PAID) {
            // Reverter o valor original
            await this.ledgerService.logOperation(
                LedgerOperationType.UPDATE,
                original.type === TransactionType.EXPENSE ? original.amount : -original.amount,
                originalAccount,
                `Transação atualizada de (-): ${updateData.description}`,
                originalId,
            );

            // Aplicar o novo valor
            await this.ledgerService.logOperation(
                LedgerOperationType.UPDATE,
                original.type === TransactionType.EXPENSE ? -updateData.amount : updateData.amount,
                originalAccount,
                `Transação atualizada de (+): ${updateData.description}`,
                originalId,
            );
            return;
        }

        // Caso 3: UNPAID -> PAID (criar lançamento)
        if (original.status === TransactionStatus.UNPAID && updateData.status === TransactionStatus.PAID) {
            await this.ledgerService.logOperation(
                LedgerOperationType.UPDATE,
                original.type === TransactionType.EXPENSE ? -updateData.amount : updateData.amount,
                originalAccount,
                `Transação atualizada para PAID: ${updateData.description}`,
                originalId,
            );
        }
    }

    async update(id: string, updateTransactionDto: UpdateTransactionDto): Promise<Transaction> {
        updateTransactionDto.amount = updateTransactionDto.amount * 100;

        const original = await this.transactionRepository.findById(id);
        if (!original) throw new NotFoundException(`Transaction with ID ${id} not found`);

        const updateData: any = {
            description: updateTransactionDto.description || original.description,
            amount: updateTransactionDto.amount !== undefined ? updateTransactionDto.amount : original.amount,
            date: updateTransactionDto.date ? new Date(updateTransactionDto.date) : original.date,
            type: updateTransactionDto.type || original.type,
            category: updateTransactionDto.categoryId ? new Types.ObjectId(updateTransactionDto.categoryId) : original.category,
            status: updateTransactionDto.status || original.status,
            account: updateTransactionDto.account || original.account,
        };

        // Buscar conta para validar tipo
        const account = await this.accountRepository.findById(updateData.account.toString());
        if (!account) {
            throw new NotFoundException(`Account with ID ${updateData.account} not found`);
        }

        // Validações para cartão de crédito
        if (account.type === 'credit_card') {
            if (updateData.status === TransactionStatus.UNPAID) {
                throw new BadRequestException('Transações em cartão de crédito não podem ter status pendente');
            }
            if (updateData.type === TransactionType.INCOME) {
                throw new BadRequestException('Transações em cartão de crédito não podem ser do tipo receita');
            }
        }

        // Atualizar livro caixa baseado nas mudanças de status
        await this.handleLedgerUpdatesOnTransactionUpdate(original, updateData);

        const updated = await this.transactionRepository.update(id, updateData);

        return updated;
    }

    async remove(id: string): Promise<void> {
        const original = await this.transactionRepository.findById(id);
        if (!original) throw new NotFoundException(`Transaction with ID ${id} not found`);

        if (original.status === TransactionStatus.PAID) {
            await this.ledgerService.logOperation(
                LedgerOperationType.DELETE,
                original.type  ===  TransactionType.EXPENSE ? original.amount : -original.amount,
                JSON.parse(JSON.stringify(original.account)),
                `Transação removida: ${original.description}`,
                (original as any)._id.toString(),
            );
        }

        await this.transactionRepository.delete(id);
    }

    async findByCategory(category: string): Promise<Transaction[]> {
        return this.transactionRepository.findByCategory(category);
    }

    async findByStatus(status: string): Promise<Transaction[]> {
        return this.transactionRepository.findByStatus(status);
    }

    async findByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
        return this.transactionRepository.findByDateRange(
            new Date(startDate),
            new Date(endDate),
        );
    }

    async findByMonth(year: number, month: number): Promise<Transaction[]> {
        return this.transactionRepository.findByMonth(year, month);
    }

    async getAvailableMonths(): Promise<{ year: number; month: number }[]> {
        return this.transactionRepository.getAvailableMonths();
    }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { TransactionRepository } from '../../repositories/transaction.repository';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '../../entities/transaction.entity';
import { LedgerService } from '../ledger/ledger.service';
import { LedgerOperationType } from '../../entities/ledger.entity';
import { AccountRepository } from '../../repositories/account.repository';
import { AccountType } from '@/entities/account.entity';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly ledgerService: LedgerService,
    private readonly accountRepository: AccountRepository
  ) {}

  private async filterIncomeCreditCardTransactionsToShow(
    transactions: Transaction[]
  ): Promise<Transaction[]> {
    const accounts = await this.accountRepository.findAll();
    return transactions.filter((tx) => {
      const account = accounts.find(
        (acc) => (acc as any)._id.toString() === (tx.account as any).toString()
      );
      if (!account) return false;
      if (
        account.type === AccountType.CREDIT_CARD &&
        tx.type === TransactionType.INCOME
      )
        return false;
      return true;
    });
  }

  private buildDateWithCurrentTime(date: string | Date): Date {
    const dateNow = new Date();
    const transactionDate = new Date(date as any);
    transactionDate.setHours(
      dateNow.getHours(),
      dateNow.getMinutes(),
      dateNow.getSeconds(),
      dateNow.getMilliseconds()
    );
    return transactionDate;
  }

  private sortTransactionsByDate(transactions: Transaction[]): Transaction[] {
    return transactions.sort((a, b) => {
      const orderA = (a as any).sortOrder ?? 0;
      const orderB = (b as any).sortOrder ?? 0;
      if (orderA !== orderB) return orderB - orderA; // sortOrder DESC
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA; // date DESC as tiebreaker
    });
  }

  async findWithFilters(filters: any): Promise<Transaction[]> {
    const transactions =
      await this.transactionRepository.findWithFilters(filters);
    let filtered = transactions;

    if (!filters?.withCreditCardFilter) {
      filtered =
        await this.filterIncomeCreditCardTransactionsToShow(transactions);
    }

    return this.sortTransactionsByDate(filtered);
  }

  async findByDescription(description: string): Promise<Transaction[]> {
    return this.transactionRepository.findByDescription(description);
  }

  async findByAccount(accountId: string): Promise<Transaction[]> {
    return this.transactionRepository.findByAccount(accountId);
  }

  async create(
    createTransactionDto: CreateTransactionDto,
    byPassCreditInvoiceCheck = false
  ): Promise<Transaction> {
    createTransactionDto.amount = createTransactionDto.amount * 100;

    // Buscar conta para validar tipo
    const account = await this.accountRepository.findById(
      createTransactionDto.account.toString()
    );
    if (!account) {
      throw new NotFoundException(
        `Account with ID ${createTransactionDto.account} not found`
      );
    }

    // Validações para cartão de crédito
    if (account.type === 'credit_card') {
      if (createTransactionDto.status === TransactionStatus.UNPAID) {
        throw new BadRequestException(
          'Transações em cartão de crédito não podem ter status pendente'
        );
      }
      if (
        createTransactionDto.type === TransactionType.INCOME &&
        !byPassCreditInvoiceCheck
      ) {
        throw new BadRequestException(
          'Transações em cartão de crédito não podem ser do tipo receita'
        );
      }
    }

    const transactionDate = this.buildDateWithCurrentTime(
      createTransactionDto.date
    );

    const txDate = new Date(createTransactionDto.date);
    const txYear = txDate.getUTCFullYear();
    const txMonth = txDate.getUTCMonth() + 1;
    const maxSortOrder =
      await this.transactionRepository.findMaxSortOrderForMonth(
        txYear,
        txMonth
      );

    const transaction: any = {
      description: createTransactionDto.description,
      amount: createTransactionDto.amount,
      date: transactionDate,
      type: createTransactionDto.type,
      category: new Types.ObjectId(createTransactionDto.categoryId),
      status: createTransactionDto.status,
      account: createTransactionDto.account,
      isFixed: createTransactionDto.isFixed || false,
      isPayment: createTransactionDto.isPayment || false,
      sortOrder: maxSortOrder + 1,
    };

    const created = await this.transactionRepository.create(transaction);

    if (created.status === TransactionStatus.PAID) {
      try {
        await this.ledgerService.logOperation(
          LedgerOperationType.CREATE,
          created.type === TransactionType.EXPENSE
            ? -created.amount
            : created.amount,
          new Types.ObjectId(created.account.toString()),
          `Transação criada: ${created.description}`,
          new Types.ObjectId((created as any)._id)
        );
      } catch (error) {
        await this.transactionRepository.delete(
          (created as any)._id.toString()
        );
        throw error;
      }
    }

    if (createTransactionDto.isFixed) {
      for (let i = 1; i <= 11; i++) {
        const nextDate = new Date(transactionDate);
        const targetMonth = nextDate.getMonth() + i;
        nextDate.setMonth(targetMonth);

        // Previne pular para o próximo mês se o dia for > 28-30 e o mês-alvo for mais curto
        if (nextDate.getMonth() !== ((targetMonth % 12) + 12) % 12) {
          nextDate.setDate(0);
        }

        const nextStatus =
          account.type === 'credit_card'
            ? TransactionStatus.PAID
            : TransactionStatus.UNPAID;

        const nextTransaction: any = {
          ...transaction,
          date: nextDate,
          status: nextStatus,
          isPayment: transaction.isPayment,
        };

        const nextCreated =
          await this.transactionRepository.create(nextTransaction);

        if (nextCreated.status === TransactionStatus.PAID) {
          try {
            await this.ledgerService.logOperation(
              LedgerOperationType.CREATE,
              nextCreated.type === TransactionType.EXPENSE
                ? -nextCreated.amount
                : nextCreated.amount,
              new Types.ObjectId(nextCreated.account.toString()),
              `Transação criada: ${nextCreated.description}`,
              new Types.ObjectId((nextCreated as any)._id)
            );
          } catch (error) {
            await this.transactionRepository.delete(
              (nextCreated as any)._id.toString()
            );
            throw error;
          }
        }
      }
    }

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
    updateData: any
  ): Promise<void> {
    const originalId = (original as any)._id.toString();
    const originalAccountId = original.account.toString();
    const newAccountId = updateData.account
      ? updateData.account.toString()
      : originalAccountId;

    // Caso 1: PAID -> UNPAID (reverter lançamento)
    if (
      original.status === TransactionStatus.PAID &&
      updateData.status === TransactionStatus.UNPAID
    ) {
      await this.ledgerService.logOperation(
        LedgerOperationType.UPDATE,
        original.type === TransactionType.EXPENSE
          ? original.amount
          : -original.amount,
        new Types.ObjectId(originalAccountId),
        `Transação atualizada para unpaid: ${updateData.description}`,
        new Types.ObjectId(originalId)
      );
      return;
    }

    // Caso 2: PAID -> PAID (atualizar valores)
    if (
      original.status === TransactionStatus.PAID &&
      updateData.status === TransactionStatus.PAID
    ) {
      if (originalAccountId === newAccountId) {
        const originalEffect =
          original.type === TransactionType.EXPENSE
            ? -original.amount
            : original.amount;
        const newEffect =
          updateData.type === TransactionType.EXPENSE
            ? -updateData.amount
            : updateData.amount;
        const netChange = newEffect - originalEffect;

        if (netChange !== 0) {
          await this.ledgerService.logOperation(
            LedgerOperationType.UPDATE,
            netChange,
            new Types.ObjectId(newAccountId),
            `Transação atualizada: ${updateData.description}`,
            new Types.ObjectId(originalId)
          );
        }
      } else {
        const originalRevertValue =
          original.type === TransactionType.EXPENSE
            ? original.amount
            : -original.amount;
        const newApplyValue =
          updateData.type === TransactionType.EXPENSE
            ? -updateData.amount
            : updateData.amount;

        if (newApplyValue < 0) {
          await this.ledgerService.logOperation(
            LedgerOperationType.UPDATE,
            newApplyValue,
            new Types.ObjectId(newAccountId),
            `Transação transferida (entrada): ${updateData.description}`,
            new Types.ObjectId(originalId)
          );
          await this.ledgerService.logOperation(
            LedgerOperationType.UPDATE,
            originalRevertValue,
            new Types.ObjectId(originalAccountId),
            `Transação transferida (saída): ${updateData.description}`,
            new Types.ObjectId(originalId)
          );
        } else {
          await this.ledgerService.logOperation(
            LedgerOperationType.UPDATE,
            originalRevertValue,
            new Types.ObjectId(originalAccountId),
            `Transação transferida (saída): ${updateData.description}`,
            new Types.ObjectId(originalId)
          );
          await this.ledgerService.logOperation(
            LedgerOperationType.UPDATE,
            newApplyValue,
            new Types.ObjectId(newAccountId),
            `Transação transferida (entrada): ${updateData.description}`,
            new Types.ObjectId(originalId)
          );
        }
      }
      return;
    }

    // Caso 3: UNPAID -> PAID (criar lançamento)
    if (
      original.status === TransactionStatus.UNPAID &&
      updateData.status === TransactionStatus.PAID
    ) {
      await this.ledgerService.logOperation(
        LedgerOperationType.UPDATE,
        updateData.type === TransactionType.EXPENSE
          ? -updateData.amount
          : updateData.amount,
        new Types.ObjectId(newAccountId),
        `Transação atualizada para PAID: ${updateData.description}`,
        new Types.ObjectId(originalId)
      );
    }
  }

  async update(
    id: string,
    updateTransactionDto: UpdateTransactionDto
  ): Promise<Transaction> {
    if (updateTransactionDto.amount !== undefined) {
      updateTransactionDto.amount = updateTransactionDto.amount * 100;
    }
    const original = await this.transactionRepository.findById(id);
    if (!original)
      throw new NotFoundException(`Transaction with ID ${id} not found`);

    const updateData: any = {
      description: updateTransactionDto.description || original.description,
      amount:
        updateTransactionDto.amount !== undefined
          ? updateTransactionDto.amount
          : original.amount,
      date: original.date,
      type: updateTransactionDto.type || original.type,
      category: updateTransactionDto.categoryId
        ? new Types.ObjectId(updateTransactionDto.categoryId)
        : original.category,
      status: updateTransactionDto.status || original.status,
      account: updateTransactionDto.account || original.account,
    };

    // Buscar conta para validar tipo
    const account = await this.accountRepository.findById(
      updateData.account.toString()
    );
    if (!account) {
      throw new NotFoundException(
        `Account with ID ${updateData.account} not found`
      );
    }

    // Validações para cartão de crédito
    if (account.type === 'credit_card') {
      if (updateData.status === TransactionStatus.UNPAID) {
        throw new BadRequestException(
          'Transações em cartão de crédito não podem ter status pendente'
        );
      }
      if (updateData.type === TransactionType.INCOME) {
        throw new BadRequestException(
          'Transações em cartão de crédito não podem ser do tipo receita'
        );
      }
    }

    const updated = await this.transactionRepository.update(id, updateData);

    try {
      await this.handleLedgerUpdatesOnTransactionUpdate(original, updateData);
    } catch (err) {
      await this.transactionRepository.update(id, original);
      throw err;
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const original = await this.transactionRepository.findById(id);
    if (!original)
      throw new NotFoundException(`Transaction with ID ${id} not found`);

    await this.transactionRepository.delete(id);

    if (original.status === TransactionStatus.PAID) {
      try {
        await this.ledgerService.logOperation(
          LedgerOperationType.DELETE,
          original.type === TransactionType.EXPENSE
            ? original.amount
            : -original.amount,
          new Types.ObjectId(original.account.toString()),
          `Transação removida: ${original.description}`,
          new Types.ObjectId((original as any)._id)
        );
      } catch (err) {
        await this.transactionRepository.create(original);
        throw err;
      }
    }
  }

  async findByCategory(category: string): Promise<Transaction[]> {
    return this.transactionRepository.findByCategory(category);
  }

  async findByStatus(status: string): Promise<Transaction[]> {
    return this.transactionRepository.findByStatus(status);
  }

  async findByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Transaction[]> {
    return this.transactionRepository.findByDateRange(
      new Date(startDate),
      new Date(endDate)
    );
  }

  async findByMonth(year: number, month: number): Promise<Transaction[]> {
    return this.transactionRepository.findByMonth(year, month);
  }

  async getAvailableMonths(): Promise<{ year: number; month: number }[]> {
    return this.transactionRepository.getAvailableMonths();
  }

  async reorder(ids: string[]): Promise<void> {
    await this.transactionRepository.reorder(ids);
  }
}

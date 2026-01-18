import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { AccountRepository } from '../../repositories/account.repository';
import { Account, AccountType } from '../../entities/account.entity';
import { TransactionType, TransactionStatus } from '../../entities/transaction.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class AccountService {
  constructor(
    private readonly accountRepository: AccountRepository,
    @Inject(forwardRef(() => TransactionsService))
    private readonly transactionsService: TransactionsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(data: Partial<Account>) {
        const accountValues = {initialBalance: data.initialBalance * 100 || 0, creditLimit: data.creditLimit * 100 || 0};
    return this.accountRepository.create({...data, ...accountValues});
  }

  async findAll() {
    return this.accountRepository.findAll();
  }

  async findById(id: string) {
    const account = await this.accountRepository.findById(id);
    if (!account) throw new NotFoundException(`Account with ID ${id} not found`);
    return account;
  }

  async update(id: string, data: Partial<Account>, scapeMultiplyValues = false) {
    let accountValues = {};
    if (scapeMultiplyValues) {
      accountValues = {initialBalance: data.initialBalance * 100 || 0, creditLimit: data.creditLimit * 100 || 0};
    }
    const account = await this.accountRepository.update(id, {...data, ...accountValues});
    if (!account) throw new NotFoundException(`Account with ID ${id} not found`);
    return account;
  }

  async delete(id: string) {
    const account = await this.accountRepository.delete(id);
    if (!account) throw new NotFoundException(`Account with ID ${id} not found`);
    return account;
  }

  async findByType(type: AccountType | string) {
    return this.accountRepository.findAll().then(accounts => accounts.filter(acc => acc.type === type));
  }

  async payInvoice(creditCardId: string, checkingAccountId: string) {
    // Buscar cartão de crédito
    const creditCard = await this.accountRepository.findById(creditCardId);
    if (!creditCard) {
      throw new NotFoundException(`Credit card with ID ${creditCardId} not found`);
    }
    if (creditCard.type !== AccountType.CREDIT_CARD) {
      throw new BadRequestException('Account must be a credit card');
    }

    // Buscar conta corrente
    const checkingAccount = await this.accountRepository.findById(checkingAccountId);
    if (!checkingAccount) {
      throw new NotFoundException(`Checking account with ID ${checkingAccountId} not found`);
    }
    if (checkingAccount.type !== AccountType.CHECKING) {
      throw new BadRequestException('Account must be a checking account');
    }

    // Calcular valor da fatura: creditLimit - saldo atual
    const invoiceAmount = creditCard.creditLimit - creditCard.initialBalance;
    
    if (invoiceAmount <= 0) {
      throw new BadRequestException('No invoice to pay');
    }

    // Buscar categoria de despesa padrão
    const categories = await this.categoriesService.findByType('expense');
    if (!categories || categories.length === 0) {
      throw new BadRequestException('No expense category found. Please create at least one expense category.');
    }
    
    const categoryId = (categories[0] as any)._id?.toString() || categories[0].toString();

    // Buscar categoria de receita para a transação no cartão
    const incomeCategories = await this.categoriesService.findByType('income');
    if (!incomeCategories || incomeCategories.length === 0) {
      throw new BadRequestException('No income category found. Please create at least one income category.');
    }
    const incomeCategoryId = (incomeCategories[0] as any)._id?.toString() || incomeCategories[0].toString();

    // Criar transação de pagamento na conta corrente (despesa)
    await this.transactionsService.create({
      description: `Pagamento fatura ${creditCard.name}`,
      amount: invoiceAmount,
      date: new Date().toISOString().split('T')[0],
      type: TransactionType.EXPENSE,
      categoryId: categoryId,
      status: TransactionStatus.PAID,
      account: checkingAccountId,
    });

    // Criar transação de recebimento no cartão (receita)
    await this.transactionsService.create({
      description: `Pagamento fatura ${creditCard.name}`,
      amount: invoiceAmount,
      date: new Date().toISOString().split('T')[0],
      type: TransactionType.INCOME,
      categoryId: incomeCategoryId,
      status: TransactionStatus.PAID,
      account: creditCardId,
    }, true); // byPassCreditInvoiceCheck = true

    // Resetar saldo do cartão para o limite
    await this.accountRepository.update(creditCardId, {
      initialBalance: creditCard.creditLimit
    });

    return {
      creditCardId,
      checkingAccountId,
      invoiceAmount,
      creditCardName: creditCard.name,
      checkingAccountName: checkingAccount.name,
      message: 'Invoice payment processed successfully'
    };
  }
}

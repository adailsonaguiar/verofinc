import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { AccountRepository } from '../../repositories/account.repository';
import { Account, AccountType } from '../../entities/account.entity';
import {
  TransactionType,
  TransactionStatus,
} from '../../entities/transaction.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class AccountService {
  constructor(
    private readonly accountRepository: AccountRepository,
    @Inject(forwardRef(() => TransactionsService))
    private readonly transactionsService: TransactionsService,
    private readonly categoriesService: CategoriesService
  ) {}

  async create(data: Partial<Account>) {
    const accountValues = {
      initialBalance: data.initialBalance * 100 || 0,
      creditLimit: data.creditLimit * 100 || 0,
    };
    return this.accountRepository.create({ ...data, ...accountValues });
  }

  async findAll() {
    return this.accountRepository.findAll();
  }

  async findById(id: string) {
    const account = await this.accountRepository.findById(id);
    if (!account)
      throw new NotFoundException(`Account with ID ${id} not found`);
    return account;
  }

  async update(id: string, data: Partial<Account>, isFromApi: boolean = false) {
    const updatePayload: any = { ...data };
    if (isFromApi) {
      if (updatePayload.initialBalance !== undefined) {
        updatePayload.initialBalance *= 100;
      }
      if (updatePayload.creditLimit !== undefined) {
        updatePayload.creditLimit *= 100;
      }
    }

    const account = await this.accountRepository.update(id, updatePayload);
    if (!account)
      throw new NotFoundException(`Account with ID ${id} not found`);
    return account;
  }

  async delete(id: string) {
    const account = await this.accountRepository.delete(id);
    if (!account)
      throw new NotFoundException(`Account with ID ${id} not found`);
    return account;
  }

  async findByType(type: AccountType | string) {
    return this.accountRepository
      .findAll()
      .then((accounts) => accounts.filter((acc) => acc.type === type));
  }

  async payInvoice(
    creditCardId: string,
    checkingAccountId: string,
    year: number,
    month: number
  ) {
    // Buscar cartão de crédito
    const creditCard = await this.accountRepository.findById(creditCardId);
    if (!creditCard) {
      throw new NotFoundException(
        `Credit card with ID ${creditCardId} not found`
      );
    }
    if (creditCard.type !== AccountType.CREDIT_CARD) {
      throw new BadRequestException('Account must be a credit card');
    }

    // Buscar conta corrente
    const checkingAccount =
      await this.accountRepository.findById(checkingAccountId);
    if (!checkingAccount) {
      throw new NotFoundException(
        `Checking account with ID ${checkingAccountId} not found`
      );
    }
    if (checkingAccount.type !== AccountType.CHECKING) {
      throw new BadRequestException('Account must be a checking account');
    }

    // Calcular fatura do mês com base nas transações do mês selecionado
    const monthTransactions = await this.transactionsService.findWithFilters({
      account: creditCardId,
      year,
      month,
      withCreditCardFilter: true,
    });

    const monthExpenses = monthTransactions
      .filter((t) => t.type === TransactionType.EXPENSE && !t.isPayment)
      .reduce((sum, t) => sum + t.amount, 0);

    const monthPayments = monthTransactions
      .filter((t) => t.type === TransactionType.INCOME && t.isPayment)
      .reduce((sum, t) => sum + t.amount, 0);

    const invoiceAmount = (monthExpenses - monthPayments) / 100;

    if (invoiceAmount <= 0) {
      throw new BadRequestException('No invoice to pay for this month');
    }

    // Buscar ou criar categoria do sistema "Pagamento de Fatura"
    let sysCategory = null;
    const allExpCategories = await this.categoriesService.findByType('expense');
    sysCategory = allExpCategories.find(
      (c) =>
        c.name === 'Pagamento de Fatura' || c.name === 'Pagamento de fatura'
    );

    if (!sysCategory) {
      sysCategory = await this.categoriesService.create({
        name: 'Pagamento de Fatura',
        type: 'expense' as any,
        active: true,
        icon: '💳',
      });
    }

    const magicCategoryId = (sysCategory as any)._id.toString();
    // Data do pagamento = último dia do mês selecionado
    const paymentDate = new Date(year, month - 1, 1)
      .toISOString()
      .split('T')[0];

    // Criar transação de pagamento na conta corrente (despesa)
    await this.transactionsService.create({
      description: `Pagamento fatura ${creditCard.name} ${String(month).padStart(2, '0')}/${year}`,
      amount: invoiceAmount,
      date: paymentDate,
      type: TransactionType.EXPENSE,
      categoryId: magicCategoryId,
      status: TransactionStatus.PAID,
      account: checkingAccountId,
      isPayment: true,
    });

    // Criar transação de recebimento no cartão (receita)
    await this.transactionsService.create(
      {
        description: `Pagamento fatura ${creditCard.name} ${String(month).padStart(2, '0')}/${year}`,
        amount: invoiceAmount,
        date: paymentDate,
        type: TransactionType.INCOME,
        categoryId: magicCategoryId,
        status: TransactionStatus.PAID,
        account: creditCardId,
        isPayment: true,
      },
      true
    ); // byPassCreditInvoiceCheck = true

    return {
      creditCardId,
      checkingAccountId,
      invoiceAmount,
      year,
      month,
      creditCardName: creditCard.name,
      checkingAccountName: checkingAccount.name,
      message: 'Invoice payment processed successfully',
    };
  }
}

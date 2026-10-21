export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum TransactionStatus {
  PAID = 'paid',
  UNPAID = 'unpaid',
}

export enum CategoryType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum InvoiceStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  OVERDUE = 'overdue',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
}

export interface Account {
  _id: string;
  name: string;
  type: string;
  active?: boolean;
  initialBalance?: number;
  creditLimit?: number;
  closingDay?: number;
  dueDay?: number;
}

export interface TransactionFilters {
  year?: number;
  month?: number;
  account?: string;
  category?: string;
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  withCreditCardFilter?: boolean;
}

export interface Invoice {
  _id: string;
  account: string;
  referenceMonth: string;
  startDate: string;
  closingDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  closedAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  transactions?: Transaction[];
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  type: CategoryType;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  _id: string;
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  category: Category;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
  account: string;
  invoice?: string;
  isFixed?: boolean;
  isPayment?: boolean;
  sortOrder?: number;
}

export interface BudgetCategoryItem {
  category: Category;
  limit: number | null;
  spent: number;
}

export interface BudgetOverview {
  month: string;
  totalLimit: number | null;
  totalSpent: number;
  items: BudgetCategoryItem[];
}

export interface CreateTransactionDto {
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  categoryId: string;
  status: TransactionStatus;
  account?: string;
  isFixed?: boolean;
}

export interface UpdateTransactionDto {
  description?: string;
  amount?: number;
  date?: string;
  type?: TransactionType;
  categoryId?: string;
  status?: TransactionStatus;
  account?: string;
}

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum TransactionStatus {
  PAID = 'paid',
  UNPAID = 'unpaid',
}

export enum ScheduledPaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export enum RecurrenceFrequency {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
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

export interface ScheduledPaymentRecurrence {
  frequency: RecurrenceFrequency;
  interval: number;
  endDate?: string;
  anchorDate: string;
}

export interface ScheduledPayment {
  _id: string;
  description: string;
  amount: number;
  dueDate: string;
  type: TransactionType;
  category: Category;
  account: Account;
  status: ScheduledPaymentStatus;
  recurrence?: ScheduledPaymentRecurrence;
  seriesId?: string;
  occurrenceNumber: number;
  transaction?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduledPaymentDto {
  description: string;
  amount: number;
  dueDate: string;
  type: TransactionType;
  categoryId: string;
  account: string;
  recurrence?: {
    frequency: RecurrenceFrequency;
    interval: number;
    endDate?: string;
  };
}

export type UpdateScheduledPaymentDto = Partial<
  Omit<CreateScheduledPaymentDto, 'recurrence'>
>;

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

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

export interface Account {
  _id: string;
  name: string;
  type: string;
  active: boolean;
  initialBalance?: number;
  creditLimit?: number;
  closingDay?: number;
  dueDay?: number;
}

export declare const accountService: {
  getAll(): Promise<Account[]>;
  getByType(type: string): Promise<Account[]>;
  create(data: {
    name: string;
    type: string;
    initialBalance?: number;
    creditLimit?: number;
    closingDay?: number;
    dueDay?: number;
  }): Promise<Account>;
  update(
    id: string,
    data: {
      name: string;
      initialBalance?: number;
      creditLimit?: number;
      closingDay?: number;
      dueDay?: number;
    }
  ): Promise<Account>;
  delete(id: string): Promise<void>;
};

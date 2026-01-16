export interface Account {
  _id: string;
  name: string;
  type: string;
  active: boolean;
}

export declare const accountService: {
  getAll(): Promise<Account[]>;
  getByType(type: string): Promise<Account[]>;
  create(data: { name: string; type: string }): Promise<Account>;
  update(id: string, data: { name: string }): Promise<Account>;
  delete(id: string): Promise<void>;
};

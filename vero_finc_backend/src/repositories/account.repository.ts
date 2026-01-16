import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Account, AccountDocument } from '../entities/account.entity';

@Injectable()
export class AccountRepository {
  constructor(
    @InjectModel(Account.name)
    private accountModel: Model<AccountDocument>,
  ) {}

  async create(account: Partial<Account>): Promise<Account> {
    const createdAccount = new this.accountModel(account);
    return createdAccount.save();
  }

  async findAll(): Promise<Account[]> {
    return this.accountModel.find().exec();
  }

  async findActive(): Promise<Account[]> {
    return this.accountModel.find({ active: true }).exec();
  }

  async findById(id: string): Promise<Account> {
    return this.accountModel.findById(id).exec();
  }

  async update(id: string, account: Partial<Account>): Promise<Account> {
    return this.accountModel
      .findByIdAndUpdate(id, account, { new: true })
      .exec();
  }

  async delete(id: string): Promise<Account> {
    return this.accountModel.findByIdAndDelete(id).exec();
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AccountRepository } from './account.repository';
import { Account, AccountType } from '../entities/account.entity';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AccountRepository', () => {
  let repository: AccountRepository;

  // chainable exec helper
  const withExec = (value: any) => ({ exec: vi.fn().mockResolvedValue(value) });

  let mockSave: any;
  let MockModel: any;

  const makeId = () => new Types.ObjectId();

  beforeEach(async () => {
    mockSave = vi.fn();

    MockModel = vi.fn(function (this: any, data: any) {
      Object.assign(this, data);
      this.save = mockSave;
    });
    MockModel.find = vi.fn();
    MockModel.findById = vi.fn();
    MockModel.findByIdAndUpdate = vi.fn();
    MockModel.findByIdAndDelete = vi.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountRepository,
        { provide: getModelToken(Account.name), useValue: MockModel },
      ],
    }).compile();

    repository = module.get<AccountRepository>(AccountRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should instantiate model with given data and call save()', async () => {
      const data = {
        name: 'Conta',
        type: AccountType.CHECKING,
        initialBalance: 10000,
      };
      const saved = { _id: makeId(), ...data };
      mockSave.mockResolvedValue(saved);

      const result = await repository.create(data);

      expect(MockModel).toHaveBeenCalledWith(data);
      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(result).toEqual(saved);
    });
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    it('should call model.find() and return the result', async () => {
      const accounts = [
        { _id: makeId(), name: 'A' },
        { _id: makeId(), name: 'B' },
      ];
      MockModel.find.mockReturnValue(withExec(accounts));

      const result = await repository.findAll();

      expect(MockModel.find).toHaveBeenCalledWith();
      expect(result).toEqual(accounts);
    });
  });

  // ---------------------------------------------------------------------------
  // findActive
  // ---------------------------------------------------------------------------
  describe('findActive', () => {
    it('should call model.find with active:true filter', async () => {
      const active = [{ _id: makeId(), name: 'Nubank', active: true }];
      MockModel.find.mockReturnValue(withExec(active));

      const result = await repository.findActive();

      expect(MockModel.find).toHaveBeenCalledWith({ active: true });
      expect(result).toEqual(active);
    });
  });

  // ---------------------------------------------------------------------------
  // findById
  // ---------------------------------------------------------------------------
  describe('findById', () => {
    it('should call model.findById and return the account', async () => {
      const id = makeId().toString();
      const account = { _id: id, name: 'Conta' };
      MockModel.findById.mockReturnValue(withExec(account));

      const result = await repository.findById(id);

      expect(MockModel.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(account);
    });

    it('should return null when account does not exist', async () => {
      MockModel.findById.mockReturnValue(withExec(null));

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should call findByIdAndUpdate with {new: true} and return the updated account', async () => {
      const id = makeId().toString();
      const updated = { _id: id, name: 'Novo Nome' };
      MockModel.findByIdAndUpdate.mockReturnValue(withExec(updated));

      const result = await repository.update(id, { name: 'Novo Nome' });

      expect(MockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        { name: 'Novo Nome' },
        { new: true }
      );
      expect(result).toEqual(updated);
    });
  });

  // ---------------------------------------------------------------------------
  // delete
  // ---------------------------------------------------------------------------
  describe('delete', () => {
    it('should call findByIdAndDelete and return the deleted account', async () => {
      const id = makeId().toString();
      const deleted = { _id: id, name: 'Deletada' };
      MockModel.findByIdAndDelete.mockReturnValue(withExec(deleted));

      const result = await repository.delete(id);

      expect(MockModel.findByIdAndDelete).toHaveBeenCalledWith(id);
      expect(result).toEqual(deleted);
    });

    it('should return null when account does not exist', async () => {
      MockModel.findByIdAndDelete.mockReturnValue(withExec(null));

      const result = await repository.delete('nonexistent');

      expect(result).toBeNull();
    });
  });
});

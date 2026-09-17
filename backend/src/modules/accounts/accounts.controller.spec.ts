import { Test, TestingModule } from '@nestjs/testing';
import { AccountsController } from './accounts.controller';
import { AccountService } from './account.service';
import { AccountType } from '../../entities/account.entity';
import { Types } from 'mongoose';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

describe('AccountsController', () => {
  let controller: AccountsController;
  let accountService: {
    create: Mock;
    findAll: Mock;
    findByType: Mock;
    findById: Mock;
    update: Mock;
    delete: Mock;
    payInvoice: Mock;
  };

  const makeId = () => new Types.ObjectId().toString();

  beforeEach(async () => {
    accountService = {
      create: vi.fn(),
      findAll: vi.fn(),
      findByType: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      payInvoice: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [{ provide: AccountService, useValue: accountService }],
    }).compile();

    controller = module.get<AccountsController>(AccountsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // POST /accounts
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should delegate to accountService.create and return the result', async () => {
      const body = {
        name: 'Conta Corrente',
        type: AccountType.CHECKING,
        initialBalance: 1000,
      };
      const created = { _id: makeId(), ...body };
      accountService.create.mockResolvedValue(created);

      const result = await controller.create(body);

      expect(accountService.create).toHaveBeenCalledWith(body);
      expect(result).toEqual(created);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /accounts
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    it('should return all accounts when no type query is provided', async () => {
      const accounts = [
        { _id: makeId(), name: 'A' },
        { _id: makeId(), name: 'B' },
      ];
      accountService.findAll.mockResolvedValue(accounts);

      const result = await controller.findAll();

      expect(accountService.findAll).toHaveBeenCalledTimes(1);
      expect(accountService.findByType).not.toHaveBeenCalled();
      expect(result).toEqual(accounts);
    });

    it('should delegate to findByType when type query is provided', async () => {
      const cards = [{ _id: makeId(), type: AccountType.CREDIT_CARD }];
      accountService.findByType.mockResolvedValue(cards);

      const result = await controller.findAll('credit_card');

      expect(accountService.findByType).toHaveBeenCalledWith('credit_card');
      expect(accountService.findAll).not.toHaveBeenCalled();
      expect(result).toEqual(cards);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /accounts/:id
  // ---------------------------------------------------------------------------
  describe('findOne', () => {
    it('should return the account with the given id', async () => {
      const id = makeId();
      const account = { _id: id, name: 'Conta' };
      accountService.findById.mockResolvedValue(account);

      const result = await controller.findOne(id);

      expect(accountService.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(account);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /accounts/:id
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should call update with isFromApi=true and return the updated account', async () => {
      const id = makeId();
      const body = { name: 'Novo Nome', initialBalance: 2000 };
      const updated = { _id: id, ...body };
      accountService.update.mockResolvedValue(updated);

      const result = await controller.update(id, body);

      expect(accountService.update).toHaveBeenCalledWith(id, body, true);
      expect(result).toEqual(updated);
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /accounts/:id
  // ---------------------------------------------------------------------------
  describe('remove', () => {
    it('should call delete and return the deleted account', async () => {
      const id = makeId();
      const deleted = { _id: id, name: 'Deletada' };
      accountService.delete.mockResolvedValue(deleted);

      const result = await controller.remove(id);

      expect(accountService.delete).toHaveBeenCalledWith(id);
      expect(result).toEqual(deleted);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /accounts/pay-invoice
  // ---------------------------------------------------------------------------
  describe('payInvoice', () => {
    it('should delegate to accountService.payInvoice with the provided ids', async () => {
      const creditCardId = makeId();
      const checkingAccountId = makeId();
      const paymentResult = {
        creditCardId,
        checkingAccountId,
        invoiceAmount: 400,
        creditCardName: 'Visa Gold',
        checkingAccountName: 'Nubank',
        message: 'Invoice payment processed successfully',
      };
      accountService.payInvoice.mockResolvedValue(paymentResult);

      const result = await controller.payInvoice(
        creditCardId,
        checkingAccountId,
        2026,
        5
      );

      expect(accountService.payInvoice).toHaveBeenCalledWith(
        creditCardId,
        checkingAccountId,
        2026,
        5
      );
      expect(result).toEqual(paymentResult);
    });
  });
});

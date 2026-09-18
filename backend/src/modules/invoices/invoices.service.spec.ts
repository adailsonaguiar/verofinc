import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesService } from './invoices.service';
import { InvoiceRepository } from '../../repositories/invoice.repository';
import { InvoiceStatus } from '../../entities/invoice.entity';
import { Transaction } from '../../entities/transaction.entity';
import { AccountType } from '../../entities/account.entity';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let invoiceRepo: {
    create: Mock;
    findById: Mock;
    findByAccount: Mock;
    findByAccountAndReferenceMonth: Mock;
    update: Mock;
    incrementTotal: Mock;
    decrementTotal: Mock;
  };
  let transactionModel: { find: Mock };

  const makeId = () => new Types.ObjectId();

  const makeCard = (overrides: any = {}) => ({
    _id: makeId(),
    type: AccountType.CREDIT_CARD,
    name: 'Visa',
    closingDay: 10,
    dueDay: 17,
    ...overrides,
  });

  beforeEach(async () => {
    invoiceRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findByAccount: vi.fn(),
      findByAccountAndReferenceMonth: vi.fn(),
      update: vi.fn(),
      incrementTotal: vi.fn(),
      decrementTotal: vi.fn(),
    };
    transactionModel = {
      find: vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({ exec: vi.fn().mockResolvedValue([]) }),
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: InvoiceRepository, useValue: invoiceRepo },
        {
          provide: getModelToken(Transaction.name),
          useValue: transactionModel,
        },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrCreateInvoice', () => {
    it('returns null for a non-credit-card account', async () => {
      const result = await service.getOrCreateInvoice(
        { _id: makeId(), type: AccountType.CHECKING },
        new Date(2026, 8, 5)
      );
      expect(result).toBeNull();
      expect(invoiceRepo.create).not.toHaveBeenCalled();
    });

    it('creates an invoice using default closing day for a credit card without closing day', async () => {
      const card = makeCard({ closingDay: undefined, dueDay: undefined });
      invoiceRepo.findByAccountAndReferenceMonth.mockResolvedValue(null);
      invoiceRepo.create.mockResolvedValue({
        _id: makeId(),
        referenceMonth: '2026-09',
      });

      const result = await service.getOrCreateInvoice(
        card,
        new Date(2026, 8, 5)
      );

      expect(result).not.toBeNull();
      expect(invoiceRepo.create).toHaveBeenCalledTimes(1);
      const args = invoiceRepo.create.mock.calls[0][0];
      // default closing day (31) keeps the transaction in its own month
      expect(args.referenceMonth).toBe('2026-09');
    });

    it('creates a new invoice when none exists for the period', async () => {
      const card = makeCard();
      invoiceRepo.findByAccountAndReferenceMonth.mockResolvedValue(null);
      const created = { _id: makeId(), referenceMonth: '2026-09' };
      invoiceRepo.create.mockResolvedValue(created);

      const result = await service.getOrCreateInvoice(
        card,
        new Date(2026, 8, 5)
      );

      expect(invoiceRepo.create).toHaveBeenCalledTimes(1);
      const args = invoiceRepo.create.mock.calls[0][0];
      expect(args.referenceMonth).toBe('2026-09');
      expect(args.status).toBe(InvoiceStatus.OPEN);
      expect(args.totalAmount).toBe(0);
      expect(result).toEqual(created);
    });

    it('reuses the existing invoice for the same period instead of creating', async () => {
      const card = makeCard();
      const existing = { _id: makeId(), referenceMonth: '2026-09' };
      invoiceRepo.findByAccountAndReferenceMonth.mockResolvedValue(existing);

      const result = await service.getOrCreateInvoice(
        card,
        new Date(2026, 8, 5)
      );

      expect(invoiceRepo.create).not.toHaveBeenCalled();
      expect(result).toEqual(existing);
    });

    it('creates a different invoice for the following period', async () => {
      const card = makeCard();
      invoiceRepo.findByAccountAndReferenceMonth.mockResolvedValue(null);
      invoiceRepo.create.mockResolvedValue({
        _id: makeId(),
        referenceMonth: '2026-10',
      });

      const result = await service.getOrCreateInvoice(
        card,
        new Date(2026, 8, 11)
      );

      const args = invoiceRepo.create.mock.calls[0][0];
      expect(args.referenceMonth).toBe('2026-10');
      expect(result).toBeDefined();
    });
  });

  describe('close', () => {
    it('transitions OPEN to CLOSED and sets closedAt', async () => {
      const id = makeId().toString();
      const invoice = {
        _id: id,
        status: InvoiceStatus.OPEN,
        totalAmount: 1000,
      } as any;
      invoiceRepo.findById.mockResolvedValue(invoice);
      const closed = {
        ...invoice,
        status: InvoiceStatus.CLOSED,
        closedAt: new Date(),
      };
      invoiceRepo.update.mockResolvedValue(closed);

      const result = await service.close(id);

      expect(invoiceRepo.update).toHaveBeenCalledWith(
        id,
        expect.objectContaining({ status: InvoiceStatus.CLOSED })
      );
      expect(result.status).toBe(InvoiceStatus.CLOSED);
    });

    it('does not re-close an already closed invoice', async () => {
      const id = makeId().toString();
      const invoice = {
        _id: id,
        status: InvoiceStatus.CLOSED,
      } as any;
      invoiceRepo.findById.mockResolvedValue(invoice);

      await service.close(id);

      expect(invoiceRepo.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when invoice does not exist', async () => {
      invoiceRepo.findById.mockResolvedValue(null);

      await expect(service.close('nonexistent')).rejects.toThrow();
    });
  });

  describe('markPaidByReferenceMonth', () => {
    it('sets the invoice as PAID using the provided amount when given', async () => {
      const accountId = makeId().toString();
      const invoice = {
        _id: makeId(),
        totalAmount: 2000,
        status: InvoiceStatus.OPEN,
      } as any;
      invoiceRepo.findByAccountAndReferenceMonth.mockResolvedValue(invoice);
      invoiceRepo.update.mockResolvedValue({
        ...invoice,
        status: InvoiceStatus.PAID,
        totalAmount: 187341,
        paidAmount: 187341,
      });

      await service.markPaidByReferenceMonth(accountId, '2026-09', 187341);

      expect(invoiceRepo.update).toHaveBeenCalledWith(
        invoice._id.toString(),
        expect.objectContaining({
          status: InvoiceStatus.PAID,
          totalAmount: 187341,
          paidAmount: 187341,
        })
      );
    });

    it('falls back to invoice.totalAmount when no amount is provided', async () => {
      const accountId = makeId().toString();
      const invoice = {
        _id: makeId(),
        totalAmount: 8500,
        status: InvoiceStatus.CLOSED,
      } as any;
      invoiceRepo.findByAccountAndReferenceMonth.mockResolvedValue(invoice);
      invoiceRepo.update.mockResolvedValue({
        ...invoice,
        status: InvoiceStatus.PAID,
        paidAmount: 8500,
      });

      await service.markPaidByReferenceMonth(accountId, '2026-09');

      expect(invoiceRepo.update).toHaveBeenCalledWith(
        invoice._id.toString(),
        expect.objectContaining({
          status: InvoiceStatus.PAID,
          paidAmount: 8500,
        })
      );
    });

    it('returns null and does not update when no invoice exists for the period', async () => {
      invoiceRepo.findByAccountAndReferenceMonth.mockResolvedValue(null);

      const result = await service.markPaidByReferenceMonth(
        makeId().toString(),
        '2026-09'
      );

      expect(result).toBeNull();
      expect(invoiceRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('incrementTotal / decrementTotal', () => {
    it('delegates increment to the repository', async () => {
      const id = makeId().toString();
      invoiceRepo.incrementTotal.mockResolvedValue({
        _id: id,
        totalAmount: 100,
      } as any);
      await service.incrementTotal(id, 100);
      expect(invoiceRepo.incrementTotal).toHaveBeenCalledWith(id, 100);
    });

    it('delegates decrement to the repository', async () => {
      const id = makeId().toString();
      invoiceRepo.decrementTotal.mockResolvedValue({
        _id: id,
        totalAmount: 0,
      } as any);
      await service.decrementTotal(id, 100);
      expect(invoiceRepo.decrementTotal).toHaveBeenCalledWith(id, 100);
    });
  });
});

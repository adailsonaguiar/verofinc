import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { InvoiceRepository } from './invoice.repository';
import { Invoice } from '../entities/invoice.entity';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('InvoiceRepository', () => {
  let repository: InvoiceRepository;
  let MockModel: any;

  beforeEach(async () => {
    MockModel = {
      findByIdAndDelete: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(undefined),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceRepository,
        { provide: getModelToken(Invoice.name), useValue: MockModel },
      ],
    }).compile();

    repository = module.get<InvoiceRepository>(InvoiceRepository);
  });

  it('should delete an invoice by id', async () => {
    const id = new Types.ObjectId().toString();

    await repository.delete(id);

    expect(MockModel.findByIdAndDelete).toHaveBeenCalledWith(id);
  });
});

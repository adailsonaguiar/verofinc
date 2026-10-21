import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';

describe('ExportController', () => {
  let controller: ExportController;
  let exportService: { exportAll: Mock };
  let response: { set: Mock };

  beforeEach(async () => {
    exportService = { exportAll: vi.fn() };
    response = { set: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExportController],
      providers: [{ provide: ExportService, useValue: exportService }],
    }).compile();

    controller = module.get<ExportController>(ExportController);
  });

  it('should return the export payload as a JSON download', async () => {
    const payload = {
      exportedAt: '2026-10-21T12:00:00.000Z',
      collections: {
        accounts: [{ _id: 'acc-1' }],
        transactions: [],
      },
    };
    exportService.exportAll.mockResolvedValue(payload);

    const result = await controller.exportAll(response as any);

    expect(exportService.exportAll).toHaveBeenCalledTimes(1);
    expect(response.set).toHaveBeenCalledWith({
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition':
        'attachment; filename="vero-finc-export-2026-10-21.json"',
    });
    expect(result).toEqual(payload);
  });

  it('should propagate errors without setting download headers', async () => {
    exportService.exportAll.mockRejectedValue(
      new Error('database unavailable')
    );

    await expect(controller.exportAll(response as any)).rejects.toThrow(
      'database unavailable'
    );

    expect(response.set).not.toHaveBeenCalled();
  });
});

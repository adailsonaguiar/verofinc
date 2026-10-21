import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { ExportPayload, ExportService } from './export.service';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get()
  async exportAll(
    @Res({ passthrough: true }) response: Response
  ): Promise<ExportPayload> {
    const payload = await this.exportService.exportAll();
    const fileDate = payload.exportedAt.slice(0, 10);

    response.set({
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="vero-finc-export-${fileDate}.json"`,
    });

    return payload;
  }
}

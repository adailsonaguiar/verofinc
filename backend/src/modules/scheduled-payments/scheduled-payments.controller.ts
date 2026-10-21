import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ScheduledPaymentStatus } from '../../entities/scheduled-payment.entity';
import { CreateScheduledPaymentDto } from './dto/create-scheduled-payment.dto';
import { PayScheduledPaymentDto } from './dto/pay-scheduled-payment.dto';
import { UpdateScheduledPaymentDto } from './dto/update-scheduled-payment.dto';
import { ScheduledPaymentsService } from './scheduled-payments.service';

@Controller('scheduled-payments')
export class ScheduledPaymentsController {
  constructor(private readonly service: ScheduledPaymentsService) {}

  @Post()
  create(@Body(ValidationPipe) dto: CreateScheduledPaymentDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('status') status?: ScheduledPaymentStatus | 'overdue',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.service.findAll({
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateScheduledPaymentDto
  ) {
    return this.service.update(id, dto);
  }

  @Post(':id/pay')
  pay(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: PayScheduledPaymentDto
  ) {
    return this.service.pay(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

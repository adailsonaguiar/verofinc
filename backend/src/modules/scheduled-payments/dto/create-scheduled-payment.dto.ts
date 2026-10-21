import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { TransactionType } from '../../../entities/transaction.entity';
import { RecurrenceFrequency } from '../../../entities/scheduled-payment.entity';

export class RecurrenceDto {
  @IsEnum(RecurrenceFrequency)
  frequency: RecurrenceFrequency;

  @IsInt()
  @Min(1)
  @Max(12)
  interval: number;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CreateScheduledPaymentDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsDateString()
  dueDate: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsMongoId()
  categoryId: string;

  @IsMongoId()
  account: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RecurrenceDto)
  recurrence?: RecurrenceDto;
}

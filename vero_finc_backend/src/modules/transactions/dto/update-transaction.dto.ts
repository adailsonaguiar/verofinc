import {
  TransactionStatus,
  TransactionType,
} from '@/entities/transaction.entity';
import {
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  IsString,
  Min,
  IsMongoId,
} from 'class-validator';

export class UpdateTransactionDto {
  @IsOptional()
  @IsMongoId()
  account?: string;
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsMongoId()
  categoryId?: string;

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;
}

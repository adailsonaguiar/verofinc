import {
  TransactionStatus,
  TransactionType,
} from '@/entities/transaction.entity';
import {
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsDateString,
  IsString,
  Min,
  IsMongoId,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateTransactionDto {
  @IsOptional()
  @IsMongoId()
  account?: string;
  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNotEmpty()
  @IsMongoId()
  categoryId: string;

  @IsNotEmpty()
  @IsEnum(TransactionStatus)
  status: TransactionStatus;

  @IsOptional()
  @IsBoolean()
  isFixed?: boolean;
}

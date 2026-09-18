import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class UpsertBudgetDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'month must be in YYYY-MM format',
  })
  month: string;

  @IsOptional()
  @IsMongoId()
  categoryId?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  limit: number;
}

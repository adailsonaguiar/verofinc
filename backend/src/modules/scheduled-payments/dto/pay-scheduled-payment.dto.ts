import { IsDateString, IsOptional } from 'class-validator';

export class PayScheduledPaymentDto {
  @IsOptional()
  @IsDateString()
  paidDate?: string;
}

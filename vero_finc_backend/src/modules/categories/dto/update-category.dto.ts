import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { CategoryType } from '../../../entities/category.entity';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsEnum(CategoryType)
  type?: CategoryType;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

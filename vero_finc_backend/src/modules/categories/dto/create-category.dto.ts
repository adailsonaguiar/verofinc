import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { CategoryType } from '../../../entities/category.entity';

export class CreateCategoryDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsNotEmpty()
  @IsEnum(CategoryType)
  type: CategoryType;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

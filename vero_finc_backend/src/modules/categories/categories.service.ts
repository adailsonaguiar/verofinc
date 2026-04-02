import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CategoryRepository } from '../../repositories/category.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from '../../entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const existingCategory = await this.categoryRepository.findByName(
      createCategoryDto.name,
    );

    if (existingCategory) {
      throw new ConflictException(
        `Category with name "${createCategoryDto.name}" already exists`,
      );
    }

    return this.categoryRepository.create(createCategoryDto);
  }

  sortCategories(categories: Category[]): Category[] {
    return categories.sort((a, b) => a.name.localeCompare(b.name));
  }

  async findAll(): Promise<Category[]> {
    const categories = await this.categoryRepository.findAll();
    return this.sortCategories(categories);
  }

  async findActive(): Promise<Category[]> {
    const categories = await this.categoryRepository.findActive();
    return this.sortCategories(categories);
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    if (updateCategoryDto.name) {
      const existingCategory = await this.categoryRepository.findByName(
        updateCategoryDto.name,
      );

      if (existingCategory && (existingCategory as any)._id.toString() !== id) {
        throw new ConflictException(
          `Category with name "${updateCategoryDto.name}" already exists`,
        );
      }
    }

    const category = await this.categoryRepository.update(id, updateCategoryDto);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async remove(id: string): Promise<Category> {
    const category = await this.categoryRepository.delete(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async findByType(type: string): Promise<Category[]> {
    const categories = await this.categoryRepository.findByType(type);
    return this.sortCategories(categories);
  }
}

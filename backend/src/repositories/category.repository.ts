import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from '../entities/category.entity';

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>
  ) {}

  async create(category: Partial<Category>): Promise<Category> {
    const createdCategory = new this.categoryModel(category);
    return createdCategory.save();
  }

  async findAll(): Promise<Category[]> {
    return this.categoryModel.find().exec();
  }

  async findActive(): Promise<Category[]> {
    return this.categoryModel.find({ active: true }).exec();
  }

  async findById(id: string): Promise<Category> {
    return this.categoryModel.findById(id).exec();
  }

  async findByName(name: string): Promise<Category> {
    return this.categoryModel.findOne({ name }).exec();
  }

  async update(id: string, category: Partial<Category>): Promise<Category> {
    return this.categoryModel
      .findByIdAndUpdate(id, category, { new: true })
      .exec();
  }

  async delete(id: string): Promise<Category> {
    return this.categoryModel.findByIdAndDelete(id).exec();
  }

  async findByType(type: string): Promise<Category[]> {
    return this.categoryModel.find({ type, active: true }).exec();
  }
}

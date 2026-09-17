import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoryType } from '../../entities/category.entity';
import { Types } from 'mongoose';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let categoriesService: {
    create: Mock;
    findAll: Mock;
    findActive: Mock;
    findByType: Mock;
    findOne: Mock;
    update: Mock;
    remove: Mock;
  };

  const makeId = () => new Types.ObjectId().toString();

  const makeCategory = (overrides: any = {}) => ({
    _id: makeId(),
    name: 'Alimentação',
    type: CategoryType.EXPENSE,
    active: true,
    ...overrides,
  });

  beforeEach(async () => {
    categoriesService = {
      create: vi.fn(),
      findAll: vi.fn(),
      findActive: vi.fn(),
      findByType: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [{ provide: CategoriesService, useValue: categoriesService }],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // POST /categories
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should delegate to categoriesService.create and return the result', async () => {
      const dto = { name: 'Lazer', type: CategoryType.EXPENSE };
      const created = makeCategory(dto);
      categoriesService.create.mockResolvedValue(created);

      const result = await controller.create(dto as any);

      expect(categoriesService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(created);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /categories
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    it('should call findAll when no query params are provided', async () => {
      const cats = [makeCategory()];
      categoriesService.findAll.mockResolvedValue(cats);

      const result = await controller.findAll();

      expect(categoriesService.findAll).toHaveBeenCalledTimes(1);
      expect(categoriesService.findActive).not.toHaveBeenCalled();
      expect(categoriesService.findByType).not.toHaveBeenCalled();
      expect(result).toEqual(cats);
    });

    it('should call findActive when active=true is provided', async () => {
      const cats = [makeCategory()];
      categoriesService.findActive.mockResolvedValue(cats);

      const result = await controller.findAll('true');

      expect(categoriesService.findActive).toHaveBeenCalledTimes(1);
      expect(categoriesService.findAll).not.toHaveBeenCalled();
      expect(result).toEqual(cats);
    });

    it('should call findByType when type query param is provided', async () => {
      const cats = [makeCategory({ type: CategoryType.INCOME })];
      categoriesService.findByType.mockResolvedValue(cats);

      const result = await controller.findAll(undefined, 'income');

      expect(categoriesService.findByType).toHaveBeenCalledWith('income');
      expect(categoriesService.findAll).not.toHaveBeenCalled();
      expect(result).toEqual(cats);
    });

    it('should prioritize type over active when both are provided', async () => {
      const cats = [makeCategory()];
      categoriesService.findByType.mockResolvedValue(cats);

      const result = await controller.findAll('true', 'expense');

      expect(categoriesService.findByType).toHaveBeenCalledWith('expense');
      expect(categoriesService.findActive).not.toHaveBeenCalled();
      expect(result).toEqual(cats);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /categories/:id
  // ---------------------------------------------------------------------------
  describe('findOne', () => {
    it('should return the category with the given id', async () => {
      const id = makeId();
      const cat = makeCategory({ _id: id });
      categoriesService.findOne.mockResolvedValue(cat);

      const result = await controller.findOne(id);

      expect(categoriesService.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(cat);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /categories/:id
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should delegate to categoriesService.update and return the result', async () => {
      const id = makeId();
      const dto = { name: 'Novo Nome' };
      const updated = makeCategory({ _id: id, name: 'Novo Nome' });
      categoriesService.update.mockResolvedValue(updated);

      const result = await controller.update(id, dto as any);

      expect(categoriesService.update).toHaveBeenCalledWith(id, dto);
      expect(result).toEqual(updated);
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /categories/:id
  // ---------------------------------------------------------------------------
  describe('remove', () => {
    it('should delegate to categoriesService.remove and return the result', async () => {
      const id = makeId();
      const deleted = makeCategory({ _id: id });
      categoriesService.remove.mockResolvedValue(deleted);

      const result = await controller.remove(id);

      expect(categoriesService.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual(deleted);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoryRepository } from '../../repositories/category.repository';
import { CategoryType } from '../../entities/category.entity';
import { Types } from 'mongoose';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoryRepo: {
    create: Mock;
    findAll: Mock;
    findActive: Mock;
    findById: Mock;
    findByName: Mock;
    update: Mock;
    delete: Mock;
    findByType: Mock;
  };

  const makeId = () => new Types.ObjectId();

  const makeCategory = (overrides: any = {}) => ({
    _id: makeId(),
    name: 'Alimentação',
    type: CategoryType.EXPENSE,
    active: true,
    ...overrides,
  });

  beforeEach(async () => {
    categoryRepo = {
      create: vi.fn(),
      findAll: vi.fn(),
      findActive: vi.fn(),
      findById: vi.fn(),
      findByName: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findByType: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: CategoryRepository, useValue: categoryRepo },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // sortCategories
  // ---------------------------------------------------------------------------
  describe('sortCategories', () => {
    it('should sort categories alphabetically by name', () => {
      const cats = [
        makeCategory({ name: 'Transporte' }),
        makeCategory({ name: 'Alimentação' }),
        makeCategory({ name: 'Moradia' }),
      ];
      const sorted = service.sortCategories(cats as any);
      expect(sorted.map((c) => c.name)).toEqual([
        'Alimentação',
        'Moradia',
        'Transporte',
      ]);
    });
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should create and return the new category', async () => {
      const dto = { name: 'Lazer', type: CategoryType.EXPENSE };
      const created = makeCategory(dto);
      categoryRepo.findByName.mockResolvedValue(null);
      categoryRepo.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(categoryRepo.findByName).toHaveBeenCalledWith('Lazer');
      expect(categoryRepo.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(created);
    });

    it('should throw ConflictException when category name already exists', async () => {
      const existing = makeCategory({ name: 'Lazer' });
      categoryRepo.findByName.mockResolvedValue(existing);

      await expect(
        service.create({ name: 'Lazer', type: CategoryType.EXPENSE })
      ).rejects.toThrow(ConflictException);

      expect(categoryRepo.create).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    it('should return all categories sorted alphabetically', async () => {
      const cats = [
        makeCategory({ name: 'Zumba' }),
        makeCategory({ name: 'Academia' }),
      ];
      categoryRepo.findAll.mockResolvedValue(cats);

      const result = await service.findAll();

      expect(result[0].name).toBe('Academia');
      expect(result[1].name).toBe('Zumba');
    });
  });

  // ---------------------------------------------------------------------------
  // findActive
  // ---------------------------------------------------------------------------
  describe('findActive', () => {
    it('should return only active categories sorted alphabetically', async () => {
      const cats = [
        makeCategory({ name: 'Viagem', active: true }),
        makeCategory({ name: 'Arte', active: true }),
      ];
      categoryRepo.findActive.mockResolvedValue(cats);

      const result = await service.findActive();

      expect(result[0].name).toBe('Arte');
      expect(result[1].name).toBe('Viagem');
    });
  });

  // ---------------------------------------------------------------------------
  // findOne
  // ---------------------------------------------------------------------------
  describe('findOne', () => {
    it('should return the category when found', async () => {
      const cat = makeCategory();
      categoryRepo.findById.mockResolvedValue(cat);

      const result = await service.findOne(cat._id.toString());

      expect(result).toEqual(cat);
    });

    it('should throw NotFoundException when category is not found', async () => {
      categoryRepo.findById.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should update when name is not changed', async () => {
      const id = makeId().toString();
      const dto = { type: CategoryType.INCOME };
      const updated = makeCategory({ _id: id, ...dto });
      categoryRepo.update.mockResolvedValue(updated);

      const result = await service.update(id, dto);

      expect(categoryRepo.findByName).not.toHaveBeenCalled();
      expect(result).toEqual(updated);
    });

    it('should update when new name does not conflict with another category', async () => {
      const id = makeId().toString();
      const dto = { name: 'Novo Nome' };
      categoryRepo.findByName.mockResolvedValue(null);
      const updated = makeCategory({ name: 'Novo Nome' });
      categoryRepo.update.mockResolvedValue(updated);

      const result = await service.update(id, dto);

      expect(result).toEqual(updated);
    });

    it('should allow update when the only category with the same name is itself', async () => {
      const id = makeId().toString();
      const existing = makeCategory({
        _id: { toString: () => id },
        name: 'Same',
      });
      categoryRepo.findByName.mockResolvedValue(existing);
      const updated = makeCategory({ name: 'Same' });
      categoryRepo.update.mockResolvedValue(updated);

      await expect(service.update(id, { name: 'Same' })).resolves.toEqual(
        updated
      );
    });

    it('should throw ConflictException when renaming to an existing name from another category', async () => {
      const id = makeId().toString();
      const otherId = makeId().toString();
      const otherCat = makeCategory({
        _id: { toString: () => otherId },
        name: 'Duplicado',
      });
      categoryRepo.findByName.mockResolvedValue(otherCat);

      await expect(service.update(id, { name: 'Duplicado' })).rejects.toThrow(
        ConflictException
      );
    });

    it('should throw NotFoundException when category to update does not exist', async () => {
      const id = makeId().toString();
      categoryRepo.findByName.mockResolvedValue(null);
      categoryRepo.update.mockResolvedValue(null);

      await expect(service.update(id, { name: 'X' })).rejects.toThrow(
        NotFoundException
      );
    });
  });

  // ---------------------------------------------------------------------------
  // remove
  // ---------------------------------------------------------------------------
  describe('remove', () => {
    it('should delete and return the category', async () => {
      const cat = makeCategory();
      categoryRepo.delete.mockResolvedValue(cat);

      const result = await service.remove(cat._id.toString());

      expect(result).toEqual(cat);
    });

    it('should throw NotFoundException when category does not exist', async () => {
      categoryRepo.delete.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  // ---------------------------------------------------------------------------
  // findByType
  // ---------------------------------------------------------------------------
  describe('findByType', () => {
    it('should return sorted categories filtered by type', async () => {
      const cats = [
        makeCategory({ name: 'Salário', type: CategoryType.INCOME }),
        makeCategory({ name: 'Freelance', type: CategoryType.INCOME }),
      ];
      categoryRepo.findByType.mockResolvedValue(cats);

      const result = await service.findByType('income');

      expect(categoryRepo.findByType).toHaveBeenCalledWith('income');
      expect(result[0].name).toBe('Freelance');
      expect(result[1].name).toBe('Salário');
    });
  });
});

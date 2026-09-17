import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CategoryRepository } from './category.repository';
import { Category, CategoryType } from '../entities/category.entity';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('CategoryRepository', () => {
  let repository: CategoryRepository;

  const withExec = (value: any) => ({ exec: vi.fn().mockResolvedValue(value) });

  let mockSave: any;
  let MockModel: any;

  const makeId = () => new Types.ObjectId();
  const makeCat = (overrides: any = {}) => ({
    _id: makeId(),
    name: 'Alimentação',
    type: CategoryType.EXPENSE,
    active: true,
    ...overrides,
  });

  beforeEach(async () => {
    mockSave = vi.fn();

    MockModel = vi.fn(function (this: any, data: any) {
      Object.assign(this, data);
      this.save = mockSave;
    });
    MockModel.find = vi.fn();
    MockModel.findById = vi.fn();
    MockModel.findOne = vi.fn();
    MockModel.findByIdAndUpdate = vi.fn();
    MockModel.findByIdAndDelete = vi.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryRepository,
        { provide: getModelToken(Category.name), useValue: MockModel },
      ],
    }).compile();

    repository = module.get<CategoryRepository>(CategoryRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should instantiate model and call save()', async () => {
      const dto = { name: 'Lazer', type: CategoryType.EXPENSE };
      const saved = makeCat(dto);
      mockSave.mockResolvedValue(saved);

      const result = await repository.create(dto);

      expect(MockModel).toHaveBeenCalledWith(dto);
      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(result).toEqual(saved);
    });
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    it('should return all categories', async () => {
      const cats = [makeCat(), makeCat({ name: 'Transporte' })];
      MockModel.find.mockReturnValue(withExec(cats));

      const result = await repository.findAll();

      expect(MockModel.find).toHaveBeenCalledWith();
      expect(result).toEqual(cats);
    });
  });

  // ---------------------------------------------------------------------------
  // findActive
  // ---------------------------------------------------------------------------
  describe('findActive', () => {
    it('should filter by active:true', async () => {
      const cats = [makeCat({ active: true })];
      MockModel.find.mockReturnValue(withExec(cats));

      const result = await repository.findActive();

      expect(MockModel.find).toHaveBeenCalledWith({ active: true });
      expect(result).toEqual(cats);
    });
  });

  // ---------------------------------------------------------------------------
  // findById
  // ---------------------------------------------------------------------------
  describe('findById', () => {
    it('should return the category when found', async () => {
      const cat = makeCat();
      MockModel.findById.mockReturnValue(withExec(cat));

      const result = await repository.findById(cat._id.toString());

      expect(result).toEqual(cat);
    });

    it('should return null when not found', async () => {
      MockModel.findById.mockReturnValue(withExec(null));

      expect(await repository.findById('bad-id')).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // findByName
  // ---------------------------------------------------------------------------
  describe('findByName', () => {
    it('should call findOne with name filter', async () => {
      const cat = makeCat({ name: 'Saúde' });
      MockModel.findOne.mockReturnValue(withExec(cat));

      const result = await repository.findByName('Saúde');

      expect(MockModel.findOne).toHaveBeenCalledWith({ name: 'Saúde' });
      expect(result).toEqual(cat);
    });

    it('should return null when no category with that name exists', async () => {
      MockModel.findOne.mockReturnValue(withExec(null));

      expect(await repository.findByName('Inexistente')).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should call findByIdAndUpdate with {new: true}', async () => {
      const id = makeId().toString();
      const updated = makeCat({ name: 'Novo Nome' });
      MockModel.findByIdAndUpdate.mockReturnValue(withExec(updated));

      const result = await repository.update(id, { name: 'Novo Nome' });

      expect(MockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        { name: 'Novo Nome' },
        { new: true }
      );
      expect(result).toEqual(updated);
    });
  });

  // ---------------------------------------------------------------------------
  // delete
  // ---------------------------------------------------------------------------
  describe('delete', () => {
    it('should call findByIdAndDelete and return the deleted category', async () => {
      const id = makeId().toString();
      const deleted = makeCat();
      MockModel.findByIdAndDelete.mockReturnValue(withExec(deleted));

      const result = await repository.delete(id);

      expect(MockModel.findByIdAndDelete).toHaveBeenCalledWith(id);
      expect(result).toEqual(deleted);
    });
  });

  // ---------------------------------------------------------------------------
  // findByType
  // ---------------------------------------------------------------------------
  describe('findByType', () => {
    it('should call model.find with type and active:true filter', async () => {
      const cats = [makeCat({ type: CategoryType.INCOME, active: true })];
      MockModel.find.mockReturnValue(withExec(cats));

      const result = await repository.findByType('income');

      expect(MockModel.find).toHaveBeenCalledWith({
        type: 'income',
        active: true,
      });
      expect(result).toEqual(cats);
    });
  });
});

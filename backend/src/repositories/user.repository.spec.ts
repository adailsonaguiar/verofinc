import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { UserRepository } from './user.repository';
import { User } from '../entities/user.entity';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('UserRepository', () => {
  let repository: UserRepository;

  const withExec = (value: any) => ({ exec: vi.fn().mockResolvedValue(value) });

  let mockSave: any;
  let MockModel: any;

  const makeId = () => new Types.ObjectId();

  const makeUser = (overrides: any = {}) => ({
    _id: makeId(),
    email: 'user@example.com',
    name: 'Test User',
    passwordHash: 'hashed',
    role: 'user',
    ...overrides,
  });

  beforeEach(async () => {
    mockSave = vi.fn();

    MockModel = vi.fn(function (this: any, data: any) {
      Object.assign(this, data);
      this.save = mockSave;
    });
    MockModel.findOne = vi.fn();
    MockModel.findById = vi.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        { provide: getModelToken(User.name), useValue: MockModel },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should instantiate model with given data and call save()', async () => {
      const data = {
        email: 'new@example.com',
        name: 'New',
        passwordHash: 'abc',
      };
      const saved = makeUser(data);
      mockSave.mockResolvedValue(saved);

      const result = await repository.create(data);

      expect(MockModel).toHaveBeenCalledWith(data);
      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(result).toEqual(saved);
    });
  });

  // ---------------------------------------------------------------------------
  // findByEmail
  // ---------------------------------------------------------------------------
  describe('findByEmail', () => {
    it('should call findOne with lowercase email and return the user', async () => {
      const user = makeUser({ email: 'user@example.com' });
      MockModel.findOne.mockReturnValue(withExec(user));

      const result = await repository.findByEmail('user@example.com');

      expect(MockModel.findOne).toHaveBeenCalledWith({
        email: 'user@example.com',
      });
      expect(result).toEqual(user);
    });

    it('should return null when no user exists with that email', async () => {
      MockModel.findOne.mockReturnValue(withExec(null));

      const result = await repository.findByEmail('ghost@example.com');

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // findById
  // ---------------------------------------------------------------------------
  describe('findById', () => {
    it('should call findById and return the user', async () => {
      const id = makeId().toString();
      const user = makeUser({ _id: id });
      MockModel.findById.mockReturnValue(withExec(user));

      const result = await repository.findById(id);

      expect(MockModel.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(user);
    });

    it('should return null when user is not found', async () => {
      MockModel.findById.mockReturnValue(withExec(null));

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });
});

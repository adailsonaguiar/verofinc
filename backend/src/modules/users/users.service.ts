import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities/user.entity';
import { UserRepository } from '../../repositories/user.repository';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<User> {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Email já cadastrado.');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    return this.userRepository.create({
      name: data.name,
      email: data.email,
      passwordHash,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async findOrCreateGoogleUser(data: {
    email: string;
    name: string;
    googleId: string;
    avatarUrl?: string;
  }): Promise<User> {
    const byGoogleId = await this.userRepository.findByGoogleId(data.googleId);
    if (byGoogleId) {
      return byGoogleId;
    }

    const byEmail = await this.userRepository.findByEmail(data.email);
    if (byEmail) {
      if (!byEmail.googleId) {
        const linked = await this.userRepository.linkGoogleId(
          data.email,
          data.googleId,
          data.avatarUrl
        );
        return linked ?? byEmail;
      }
      return byEmail;
    }

    return this.userRepository.create({
      name: data.name,
      email: data.email,
      googleId: data.googleId,
      avatarUrl: data.avatarUrl,
      provider: 'google',
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }
}

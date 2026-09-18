import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../entities/user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>
  ) {}

  async create(user: Partial<User>): Promise<User> {
    const createdUser = new this.userModel(user);
    return createdUser.save();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userModel.findOne({ googleId }).exec();
  }

  async linkGoogleId(
    email: string,
    googleId: string,
    avatarUrl?: string
  ): Promise<User | null> {
    const update: Record<string, unknown> = { googleId };
    if (avatarUrl) update.avatarUrl = avatarUrl;
    return this.userModel
      .findOneAndUpdate(
        { email: email.toLowerCase() },
        { $set: update },
        { new: true }
      )
      .exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }
}

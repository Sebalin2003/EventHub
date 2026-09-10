import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';

@Injectable()
export class UserDao {
  constructor(@InjectRepository(User) private readonly repository: Repository<User>) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.repository.exists({ where: { email } });
  }

  async findOneOrFail(id: string): Promise<User> {
    const user = await this.repository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async save(data: Partial<User>): Promise<User> {
    return this.repository.save(data);
  }
}

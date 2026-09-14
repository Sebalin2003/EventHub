import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity.js';

@Injectable()
export class FavoriteDao {
  constructor(@InjectRepository(Favorite) private readonly repository: Repository<Favorite>) {}

  async findByUser(userId: string): Promise<Favorite[]> {
    return this.repository.find({
      where: { userId },
      relations: { event: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(userId: string, eventId: string): Promise<Favorite | null> {
    return this.repository.findOne({ where: { userId, eventId } });
  }

  async save(data: Partial<Favorite>): Promise<Favorite> {
    return this.repository.save(data);
  }

  async delete(userId: string, eventId: string): Promise<boolean> {
    const result = await this.repository.delete({ userId, eventId });
    return (result.affected ?? 0) > 0;
  }
}

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { FavoriteDao } from './favorite.dao.js';
import { EventDao } from '../events/event.dao.js';

@Injectable()
export class FavoritesService {
  constructor(
    private readonly favoriteDao: FavoriteDao,
    private readonly eventDao: EventDao,
  ) {}

  async listByUser(userId: string) {
    return this.favoriteDao.findByUser(userId);
  }

  async addFavorite(userId: string, eventId: string) {
    const event = await this.eventDao.findByLegacyId(eventId) ?? await this.eventDao.findOne(eventId);
    const databaseEventId = event.id;
    const existing = await this.favoriteDao.findOne(userId, databaseEventId);
    if (existing) {
      throw new ConflictException('Event is already in favorites');
    }
    return this.favoriteDao.save({ userId, eventId: databaseEventId });
  }

  async removeFavorite(userId: string, eventId: string) {
    const event = await this.eventDao.findByLegacyId(eventId) ?? await this.eventDao.findOne(eventId);
    const deleted = await this.favoriteDao.delete(userId, event.id);
    if (!deleted) {
      throw new NotFoundException('Favorite not found');
    }
  }
}

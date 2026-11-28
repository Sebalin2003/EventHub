import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { FavoritesService } from './favorites.service.js';
import { FavoriteDao } from './favorite.dao.js';
import { EventDao } from '../events/event.dao.js';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let favoriteDao: { findByUser: any; findOne: any; save: any; delete: any };
  let eventDao: { findOne: any };

  beforeEach(() => {
    favoriteDao = {
      findByUser: vi.fn(),
      findOne: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    eventDao = { findOne: vi.fn() };
    service = new FavoritesService(
      favoriteDao as unknown as FavoriteDao,
      eventDao as unknown as EventDao,
    );
  });

  it('listByUser delegates to dao', async () => {
    const favs = [{ id: '1' }];
    favoriteDao.findByUser.mockResolvedValue(favs);
    expect(await service.listByUser('u1')).toEqual(favs);
    expect(favoriteDao.findByUser).toHaveBeenCalledWith('u1');
  });

  it('addFavorite creates a new favorite', async () => {
    eventDao.findOne.mockResolvedValue({ id: 'ev-db' });
    favoriteDao.findOne.mockResolvedValue(null);
    favoriteDao.save.mockResolvedValue({ userId: 'u1', eventId: 'ev-db' });

    const result = await service.addFavorite('u1', 'ev-slug');
    expect(result).toEqual({ userId: 'u1', eventId: 'ev-db' });
    expect(favoriteDao.save).toHaveBeenCalledWith({ userId: 'u1', eventId: 'ev-db' });
  });

  it('addFavorite throws ConflictException if already favorited', async () => {
    eventDao.findOne.mockResolvedValue({ id: 'ev-db' });
    favoriteDao.findOne.mockResolvedValue({ id: 'existing' });

    await expect(service.addFavorite('u1', 'ev-slug')).rejects.toThrow(ConflictException);
  });

  it('removeFavorite deletes a favorite', async () => {
    eventDao.findOne.mockResolvedValue({ id: 'ev-db' });
    favoriteDao.delete.mockResolvedValue(true);

    await expect(service.removeFavorite('u1', 'ev-slug')).resolves.toBeUndefined();
    expect(favoriteDao.delete).toHaveBeenCalledWith('u1', 'ev-db');
  });

  it('removeFavorite throws NotFoundException if not found', async () => {
    eventDao.findOne.mockResolvedValue({ id: 'ev-db' });
    favoriteDao.delete.mockResolvedValue(false);

    await expect(service.removeFavorite('u1', 'ev-slug')).rejects.toThrow(NotFoundException);
  });
});

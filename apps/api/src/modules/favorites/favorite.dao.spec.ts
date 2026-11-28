import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FavoriteDao } from './favorite.dao.js';

describe('FavoriteDao', () => {
  let dao: FavoriteDao;
  let mockRepo: { find: any; findOne: any; save: any; delete: any };

  beforeEach(() => {
    mockRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    dao = new FavoriteDao(mockRepo as any);
  });

  it('findByUser returns favorites ordered by createdAt DESC', async () => {
    const favs = [{ id: '1' }];
    mockRepo.find.mockResolvedValue(favs);
    expect(await dao.findByUser('u1')).toEqual(favs);
    expect(mockRepo.find).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      relations: { event: true },
      order: { createdAt: 'DESC' },
    });
  });

  it('findOne returns a favorite or null', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    expect(await dao.findOne('u1', 'e1')).toBeNull();
    expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { userId: 'u1', eventId: 'e1' } });
  });

  it('save persists and returns the favorite', async () => {
    const data = { userId: 'u1', eventId: 'e1' };
    mockRepo.save.mockResolvedValue({ ...data, id: 'fav-1' });
    expect(await dao.save(data)).toEqual({ ...data, id: 'fav-1' });
  });

  it('delete returns true when affected > 0', async () => {
    mockRepo.delete.mockResolvedValue({ affected: 1 });
    expect(await dao.delete('u1', 'e1')).toBe(true);
  });

  it('delete returns false when affected is 0', async () => {
    mockRepo.delete.mockResolvedValue({ affected: 0 });
    expect(await dao.delete('u1', 'e1')).toBe(false);
  });

  it('delete returns false when affected is undefined', async () => {
    mockRepo.delete.mockResolvedValue({});
    expect(await dao.delete('u1', 'e1')).toBe(false);
  });
});

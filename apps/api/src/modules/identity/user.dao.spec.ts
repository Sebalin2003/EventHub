import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { UserDao } from './user.dao.js';
import { User } from './entities/user.entity.js';

describe('UserDao (Eje B: persistencia de identidad)', () => {
  let repository: any;
  let dao: UserDao;

  beforeEach(() => {
    repository = {
      findOne: vi.fn(),
      exists: vi.fn(),
      save: vi.fn(async (data: Partial<User>) => data),
    };
    dao = new UserDao(repository);
  });

  it('findByEmail busca por email', async () => {
    const user = new User();
    repository.findOne.mockResolvedValue(user);

    await expect(dao.findByEmail('a@b.com')).resolves.toBe(user);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { email: 'a@b.com' } });
  });

  it('existsByEmail delega en el repositorio', async () => {
    repository.exists.mockResolvedValue(true);
    await expect(dao.existsByEmail('a@b.com')).resolves.toBe(true);
  });

  it('findOneOrFail devuelve el usuario existente', async () => {
    const user = new User();
    repository.findOne.mockResolvedValue(user);
    await expect(dao.findOneOrFail('u1')).resolves.toBe(user);
  });

  it('findOneOrFail lanza 404 si no existe', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(dao.findOneOrFail('missing')).rejects.toThrow(NotFoundException);
  });

  it('save persiste los datos', async () => {
    const data = { email: 'a@b.com' };
    await expect(dao.save(data)).resolves.toBe(data);
    expect(repository.save).toHaveBeenCalledWith(data);
  });
});

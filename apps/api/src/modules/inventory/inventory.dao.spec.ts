import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InventoryDao } from './inventory.dao.js';
import { Inventory } from './entities/inventory.entity.js';

describe('InventoryDao (Eje B: persistencia de inventario)', () => {
  let repository: any;
  let dao: InventoryDao;

  beforeEach(() => {
    repository = {
      findOne: vi.fn(),
      create: vi.fn((data: Partial<Inventory>) => Object.assign(new Inventory(), data)),
      save: vi.fn(async (data: any) => data),
    };
    dao = new InventoryDao(repository);
  });

  it('findOne busca por eventId', async () => {
    repository.findOne.mockResolvedValue(null);
    await dao.findOne('evt-1');
    expect(repository.findOne).toHaveBeenCalledWith({ where: { eventId: 'evt-1' } });
  });

  it('save actualiza el registro existente', async () => {
    const existing = Object.assign(new Inventory(), { eventId: 'evt-1', available: 5 });
    repository.findOne.mockResolvedValue(existing);

    const result = await dao.save({ eventId: 'evt-1', available: 8 });

    expect(result).toBe(existing);
    expect(existing.available).toBe(8);
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalledWith(existing);
  });

  it('save crea un registro nuevo si no existe', async () => {
    repository.findOne.mockResolvedValue(null);

    const result = await dao.save({ eventId: 'evt-2', available: 3 });

    expect(repository.create).toHaveBeenCalledWith({ eventId: 'evt-2', available: 3 });
    expect(result).toBeInstanceOf(Inventory);
    expect(repository.save).toHaveBeenCalledWith(result);
  });

  it('save sin eventId no consulta y crea el registro', async () => {
    await dao.save({ available: 1 });

    expect(repository.findOne).not.toHaveBeenCalled();
    expect(repository.create).toHaveBeenCalledWith({ available: 1 });
  });
});

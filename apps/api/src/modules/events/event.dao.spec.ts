import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { EventDao } from './event.dao.js';
import { Event, EventStatus } from './entities/event.entity.js';

describe('EventDao (Eje B: persistencia de dominio)', () => {
  let repository: any;
  let dao: EventDao;

  beforeEach(() => {
    repository = {
      find: vi.fn(),
      findOne: vi.fn(),
      save: vi.fn(async (event: Event) => event),
      delete: vi.fn(),
    };
    dao = new EventDao(repository);
  });

  it('findAll ordena por fecha ascendente', async () => {
    const events = [new Event()];
    repository.find.mockResolvedValue(events);

    await expect(dao.findAll()).resolves.toBe(events);
    expect(repository.find).toHaveBeenCalledWith({ order: { date: 'ASC' } });
  });

  it('findVisible excluye borradores', async () => {
    repository.find.mockResolvedValue([]);

    await dao.findVisible();

    expect(repository.find).toHaveBeenCalledWith({
      where: { status: expect.anything() },
      order: { date: 'ASC' },
    });
  });

  it('findOne busca por id si recibe UUID', async () => {
    const event = new Event();
    repository.findOne.mockResolvedValue(event);

    await expect(dao.findOne('00000000-0000-0000-0000-000000000000')).resolves.toBe(event);
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: '00000000-0000-0000-0000-000000000000' },
    });
  });

  it('findOne busca por legacyId si no es UUID', async () => {
    const event = new Event();
    repository.findOne.mockResolvedValue(event);

    await expect(dao.findOne('e1')).resolves.toBe(event);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { legacyId: 'e1' } });
  });

  it('findOne lanza 404 si no existe', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(dao.findOne('e-404')).rejects.toThrow(NotFoundException);
  });

  it('findByLegacyId y findByOrganizer delegan en el repositorio', async () => {
    repository.findOne.mockResolvedValue(new Event());
    repository.find.mockResolvedValue([new Event()]);

    await expect(dao.findByLegacyId('e2')).resolves.toBeInstanceOf(Event);
    await expect(dao.findByOrganizer('org-1')).resolves.toHaveLength(1);
    expect(repository.find).toHaveBeenCalledWith({ where: { organizerId: 'org-1' }, order: { date: 'ASC' } });
  });

  it('save persiste el evento', async () => {
    const event = new Event();
    await expect(dao.save(event)).resolves.toBe(event);
    expect(repository.save).toHaveBeenCalledWith(event);
  });

  it('delete resuelve el id interno antes de borrar', async () => {
    const event = new Event();
    event.id = 'uuid-real';
    repository.findOne.mockResolvedValue(event);

    await dao.delete('e1');

    expect(repository.delete).toHaveBeenCalledWith('uuid-real');
  });

  it('delete propaga 404 si el evento no existe', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(dao.delete('missing')).rejects.toThrow(NotFoundException);
  });

  it('findVisible usa los estados publicados, cancelados y completados', async () => {
    repository.find.mockResolvedValue([]);
    await dao.findVisible();
    const where = repository.find.mock.calls[0][0].where;
    expect(where.status._value).toEqual([
      EventStatus.PUBLISHED,
      EventStatus.CANCELLED,
      EventStatus.COMPLETED,
    ]);
  });
});

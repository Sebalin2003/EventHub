import { BadRequestException, ConflictException, ForbiddenException, GoneException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InventoryDao } from './inventory.dao.js';
import { InventoryService } from './inventory.service.js';

describe('InventoryService', () => {
  let storedAvailable: number;
  let service: InventoryService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-13T12:00:00.000Z'));
    storedAvailable = 10;

    const inventoryDao = {
      findOne: vi.fn(async (eventId: string) => ({ eventId, available: storedAvailable })),
      save: vi.fn(async (data: { eventId: string; available: number }) => {
        storedAvailable = data.available;
        return data;
      }),
    } as unknown as InventoryDao;

    service = new InventoryService(inventoryDao);
    service.onModuleInit();
  });

  afterEach(() => {
    service.onModuleDestroy();
    vi.useRealTimers();
  });

  it('keeps active holds in memory and removes them on destroy', async () => {
    await service.createHold('event-1', 'user-1', 3);
    await expect(service.get('event-1')).resolves.toEqual({
      eventId: 'event-1',
      available: 7,
      held: 3,
      totalAvailable: 10,
    });

    service.onModuleDestroy();

    await expect(service.get('event-1')).resolves.toEqual({
      eventId: 'event-1',
      available: 10,
      held: 0,
      totalAvailable: 10,
    });
  });

  it('releases expired holds automatically', async () => {
    await service.createHold('event-1', 'user-1', 4, 1000);
    await vi.advanceTimersByTimeAsync(1000);

    await expect(service.get('event-1')).resolves.toEqual({
      eventId: 'event-1',
      available: 10,
      held: 0,
      totalAvailable: 10,
    });
  });

  it('prevents invalid quantities and overbooking', async () => {
    await expect(service.createHold('event-1', 'user-1', 0)).rejects.toBeInstanceOf(BadRequestException);
    await service.createHold('event-1', 'user-1', 8);
    await expect(service.createHold('event-1', 'user-2', 3)).rejects.toBeInstanceOf(ConflictException);
  });

  it('serializes simultaneous hold attempts to prevent overbooking', async () => {
    const results = await Promise.allSettled([
      service.createHold('event-1', 'user-1', 7),
      service.createHold('event-1', 'user-2', 7),
    ]);

    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(result => result.status === 'rejected')).toHaveLength(1);
    await expect(service.get('event-1')).resolves.toMatchObject({ available: 3, held: 7 });
  });

  it('allows only the owner to release a hold', async () => {
    const hold = await service.createHold('event-1', 'user-1', 2);

    await expect(service.releaseHold('event-1', hold.id, 'user-2')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.releaseHold('event-1', hold.id, 'user-1')).resolves.toMatchObject({ status: 'released' });
    await expect(service.get('event-1')).resolves.toMatchObject({ available: 10, held: 0 });
  });

  it('commits a hold exactly once and persists the sale', async () => {
    const hold = await service.createHold('event-1', 'user-1', 3);

    const results = await Promise.allSettled([
      service.commitHold('event-1', hold.id, 'user-1'),
      service.commitHold('event-1', hold.id, 'user-1'),
    ]);

    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(result => result.status === 'rejected')).toHaveLength(1);
    await expect(service.get('event-1')).resolves.toEqual({
      eventId: 'event-1',
      available: 7,
      held: 0,
      totalAvailable: 7,
    });
  });

  it('rejects committing an expired hold', async () => {
    const hold = await service.createHold('event-1', 'user-1', 1, 1000);
    vi.setSystemTime(new Date('2026-09-13T12:00:01.000Z'));

    await expect(service.commitHold('event-1', hold.id, 'user-1')).rejects.toBeInstanceOf(GoneException);
  });
});

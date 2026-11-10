import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { OutboxService } from './outbox.service.js';
import { OutboxStatus } from './outbox-message.entity.js';

function createRepository() {
  return {
    create: vi.fn().mockImplementation((data: any) => ({ id: 'outbox-1', sentAt: null, ...data })),
    save: vi.fn().mockImplementation((data: any) => Promise.resolve(data)),
    find: vi.fn(),
  };
}

describe('OutboxService (Eje C: no perder mensajes si el broker cae)', () => {
  let repository: ReturnType<typeof createRepository>;

  beforeEach(() => {
    repository = createRepository();
  });

  it('persiste el evento como PENDING antes de publicarlo', async () => {
    const service = new OutboxService(repository as any, { emit: vi.fn() } as any);

    const message = await service.enqueue('order.created', { orderId: 'ord-1' });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ topic: 'order.created', status: OutboxStatus.PENDING, attempts: 0 }),
    );
    expect(message.status).toBe(OutboxStatus.PENDING);
    expect(message.payload).toEqual({ orderId: 'ord-1' });
  });

  it('publica los pendientes y los marca SENT', async () => {
    repository.find.mockResolvedValue([
      { id: 'm1', topic: 'order.created', payload: { orderId: '1' }, status: OutboxStatus.PENDING, attempts: 0 },
    ]);
    const client = { emit: vi.fn().mockReturnValue(of(undefined)) };
    const service = new OutboxService(repository as any, client as any);

    const result = await service.flush();

    expect(client.emit).toHaveBeenCalledWith('order.created', { orderId: '1' });
    expect(result.sent).toBe(1);
    const saved = repository.save.mock.calls.at(-1)![0];
    expect(saved.status).toBe(OutboxStatus.SENT);
    expect(saved.sentAt).toBeInstanceOf(Date);
  });

  it('deja el mensaje PENDING y cuenta el intento si el broker no responde', async () => {
    repository.find.mockResolvedValue([
      { id: 'm2', topic: 'order.created', payload: {}, status: OutboxStatus.PENDING, attempts: 2 },
    ]);
    const client = { emit: vi.fn().mockReturnValue(throwError(() => new Error('broker down'))) };
    const service = new OutboxService(repository as any, client as any);

    const result = await service.flush();

    expect(result.sent).toBe(0);
    expect(result.pending).toBe(1);
    const saved = repository.save.mock.calls.at(-1)![0];
    expect(saved.status).toBe(OutboxStatus.PENDING);
    expect(saved.attempts).toBe(3);
    expect(saved.lastError).toContain('broker down');
  });

  it('cancela el dispatcher al destruir el modulo', () => {
    const service = new OutboxService(repository as any, { emit: vi.fn() } as any);
    repository.find.mockResolvedValue([]);
    service.onModuleInit();
    expect(() => service.onModuleDestroy()).not.toThrow();
  });
});

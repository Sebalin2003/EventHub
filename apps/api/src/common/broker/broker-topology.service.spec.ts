import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as amqp from 'amqplib';
import { BrokerTopologyService } from './broker-topology.service.js';
import {
  NOTIFICATIONS_DLQ,
  NOTIFICATIONS_DLX,
  NOTIFICATIONS_QUEUE,
} from './broker.constants.js';

vi.mock('amqplib', () => ({ connect: vi.fn() }));

function createChannel(overrides: Record<string, unknown> = {}) {
  return {
    on: vi.fn(),
    assertExchange: vi.fn().mockResolvedValue({}),
    assertQueue: vi.fn().mockResolvedValue({}),
    bindQueue: vi.fn().mockResolvedValue({}),
    deleteQueue: vi.fn().mockResolvedValue({}),
    close: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('BrokerTopologyService (Eje C: topologia real con DLQ)', () => {
  beforeEach(() => {
    vi.mocked(amqp.connect).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('crea el exchange, la cola DLQ durable y la cola principal con dead-letter', async () => {
    const channel = createChannel();
    const connection = {
      createChannel: vi.fn().mockResolvedValue(channel),
      close: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(amqp.connect).mockResolvedValue(connection as any);

    const service = new BrokerTopologyService();
    await service.onModuleInit();

    expect(channel.assertExchange).toHaveBeenCalledWith(NOTIFICATIONS_DLX, 'direct', { durable: true });
    expect(channel.assertQueue).toHaveBeenCalledWith(NOTIFICATIONS_DLQ, { durable: true });
    expect(channel.bindQueue).toHaveBeenCalledWith(NOTIFICATIONS_DLQ, NOTIFICATIONS_DLX, NOTIFICATIONS_DLQ);
    expect(channel.assertQueue).toHaveBeenCalledWith(
      NOTIFICATIONS_QUEUE,
      expect.objectContaining({
        durable: true,
        deadLetterExchange: NOTIFICATIONS_DLX,
        deadLetterRoutingKey: NOTIFICATIONS_DLQ,
      }),
    );
    expect(service.isReady()).toBe(true);
    service.onModuleDestroy();
  });

  it('recrea en desarrollo una cola vieja sin argumentos de DLQ (406)', async () => {
    const failingChannel = createChannel({
      assertQueue: vi
        .fn()
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(
          Object.assign(new Error('PRECONDITION_FAILED - inequivalent arg'), { code: 406 }),
        ),
    });
    const freshChannel = createChannel();
    const connection = {
      createChannel: vi.fn().mockResolvedValueOnce(failingChannel).mockResolvedValueOnce(freshChannel),
      close: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(amqp.connect).mockResolvedValue(connection as any);

    const service = new BrokerTopologyService();
    await service.onModuleInit();

    expect(freshChannel.deleteQueue).toHaveBeenCalledWith(NOTIFICATIONS_QUEUE);
    expect(freshChannel.assertQueue).toHaveBeenCalledWith(
      NOTIFICATIONS_QUEUE,
      expect.objectContaining({ deadLetterExchange: NOTIFICATIONS_DLX }),
    );
    expect(service.isReady()).toBe(true);
    service.onModuleDestroy();
  });

  it('queda no lista y reintenta cuando el broker esta caido', async () => {
    vi.mocked(amqp.connect).mockRejectedValue(new Error('ECONNREFUSED'));

    const service = new BrokerTopologyService();
    await service.onModuleInit();

    expect(service.isReady()).toBe(false);
    service.onModuleDestroy();
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationsService } from './notifications.service.js';

describe('NotificationsService (Eje C: Broker, Idempotencia y DLQ)', () => {
  let service: NotificationsService;
  let repo: any;

  beforeEach(() => {
    repo = {
      create: vi.fn().mockImplementation((data: any) => ({ ...data, id: 'notif-123' })),
      save: vi.fn().mockImplementation((data: any) => Promise.resolve(data)),
    };
    service = new NotificationsService(repo);
  });

  describe('Consumidor Idempotente (Mensaje Duplicado)', () => {
    it('debe procesar el mensaje por primera vez', async () => {
      const payload = { orderId: 'ord-100', userEmail: 'cliente@eventhub.com', total: 5000 };
      const res = await service.processIncomingMessage('order.created', payload, 'msg-unique-1');

      expect(res.status).toBe('PROCESSED');
      expect(repo.save).toHaveBeenCalledTimes(1);
      expect(service.getProcessedCount()).toBe(1);
    });

    it('debe descartar mensajes duplicados sin reprocesar ni duplicar registros', async () => {
      const payload = { orderId: 'ord-100', userEmail: 'cliente@eventhub.com', total: 5000 };

      // Primer mensaje
      await service.processIncomingMessage('order.created', payload, 'msg-repeat');
      expect(repo.save).toHaveBeenCalledTimes(1);

      // Segundo mensaje idéntico (simulando re-entrega por RabbitMQ)
      const duplicateRes = await service.processIncomingMessage('order.created', payload, 'msg-repeat');

      expect(duplicateRes.status).toBe('DUPLICATE_SKIPPED');
      expect(repo.save).toHaveBeenCalledTimes(1); // No aumentó la persistencia
      expect(service.getProcessedCount()).toBe(1);
    });
  });

  describe('Dead Letter Queue (DLQ) ante Mensaje Inválido / Poison Pill', () => {
    it('debe enrutar a DLQ tras N reintentos fallidos', async () => {
      const poisonPillPayload = { orderId: 'poison-1', userEmail: 'destinatario-invalido-sin-arroba' };

      // Intento 1
      const res1 = await service.processIncomingMessage('order.created', poisonPillPayload, 'poison-msg');
      expect(res1.status).toBe('ROUTED_TO_DLQ');

      // Intento 2
      const res2 = await service.processIncomingMessage('order.created', poisonPillPayload, 'poison-msg');
      expect(res2.status).toBe('ROUTED_TO_DLQ');

      // Intento 3 (supera maxRetries -> persiste registro en DLQ)
      const res3 = await service.processIncomingMessage('order.created', poisonPillPayload, 'poison-msg');
      expect(res3.status).toBe('ROUTED_TO_DLQ');
      expect(res3.notificationId).toBeDefined();

      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
        to: 'dlq@eventhub.com',
        template: 'dlq-poison-pill',
      }));
    });
  });
});

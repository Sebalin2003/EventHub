import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ConflictException,
  HttpStatus,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InventoryService } from '../inventory/inventory.service.js';
import { InventoryDao } from '../inventory/inventory.dao.js';
import { EventDao } from '../events/event.dao.js';
import { EventsService } from '../events/events.service.js';
import { EventFactory } from '../events/event.factory.js';
import { OrdersService } from './orders.service.js';
import { Order, OrderStatus } from './entities/order.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PaymentsService } from '../payments/payments.service.js';
import { ProblemDetailsFilter } from '../../common/filters/problem-details.filter.js';

describe('Etapa 3 — Integridad de datos y concurrencia', () => {
  describe('1. Reserva por tipo de entrada y tope por usuario (InventoryService)', () => {
    let inventoryService: InventoryService;

    beforeEach(() => {
      const inventoryDao = {
        findOne: vi.fn(async () => ({ eventId: 'evt-1', available: 100 })),
        save: vi.fn(async (data: any) => data),
      } as unknown as InventoryDao;

      const eventDao = {
        findOne: vi.fn(async () => ({
          id: 'evt-1',
          capacity: 100,
          registered: 0,
          organizerId: 'org-1',
          ticketTypes: [
            { id: 'tt-vip', name: 'VIP', price: 1000, totalQuantity: 2, sold: 0, status: 'DISPONIBLE' },
            { id: 'tt-gen', name: 'General', price: 500, totalQuantity: 98, sold: 0, status: 'DISPONIBLE' },
          ],
        })),
      } as unknown as EventDao;

      inventoryService = new InventoryService(inventoryDao, eventDao);
      inventoryService.onModuleInit();
    });

    it('concurrencia Promise.all: cupo 2 con 5 compradores simultáneos emite exactamente 2 holds y rechaza 3 con 409', async () => {
      const results = await Promise.allSettled([
        inventoryService.createHold('evt-1', 'u-1', 1, undefined, 'tt-vip'),
        inventoryService.createHold('evt-1', 'u-2', 1, undefined, 'tt-vip'),
        inventoryService.createHold('evt-1', 'u-3', 1, undefined, 'tt-vip'),
        inventoryService.createHold('evt-1', 'u-4', 1, undefined, 'tt-vip'),
        inventoryService.createHold('evt-1', 'u-5', 1, undefined, 'tt-vip'),
      ]);

      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];

      expect(fulfilled).toHaveLength(2);
      expect(rejected).toHaveLength(3);
      for (const rej of rejected) {
        expect(rej.reason).toBeInstanceOf(ConflictException);
      }
    });

    it('impone tope de reservas activas por usuario (MAX_ACTIVE_HOLDS_PER_USER)', async () => {
      for (let i = 0; i < 5; i++) {
        await inventoryService.createHold('evt-1', 'greedy-user', 1, undefined, 'tt-gen');
      }
      await expect(
        inventoryService.createHold('evt-1', 'greedy-user', 1, undefined, 'tt-gen'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('2. Idempotencia 422, concurrencia 23505 y transacción con Outbox (OrdersService)', () => {
    it('5 POST concurrentes con la misma Idempotency-Key crean 1 sola orden (atrapando 23505)', async () => {
      let persistedOrder: Order | null = null;
      const orderRepo: any = {
        findOne: vi.fn(async () => persistedOrder),
        save: vi.fn(async (order: Order) => {
          if (persistedOrder) {
            const err: any = new Error('duplicate key value violates unique constraint');
            err.driverError = { code: '23505' };
            throw err;
          }
          order.id = 'ord-single-1';
          persistedOrder = order;
          return order;
        }),
      };
      const outbox: any = { enqueue: vi.fn(async () => ({ id: 'outbox-1' })) };
      const service = new OrdersService(
        orderRepo,
        { emit: vi.fn() } as any,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        outbox,
      );

      const dto = { items: [{ eventId: 'evt-1', ticketType: 'General', quantity: 1, unitPrice: 1000 }] };
      const results = await Promise.all([
        service.create('user-1', dto as any, 'idem-race-key'),
        service.create('user-1', dto as any, 'idem-race-key'),
        service.create('user-1', dto as any, 'idem-race-key'),
        service.create('user-1', dto as any, 'idem-race-key'),
        service.create('user-1', dto as any, 'idem-race-key'),
      ]);

      for (const res of results) {
        expect(res.id).toBe('ord-single-1');
      }
      expect(outbox.enqueue).toHaveBeenCalledTimes(1);
    });

    it('responde 422 UnprocessableEntity si se reutiliza Idempotency-Key con distinto cuerpo', async () => {
      const orderRepo: any = {
        findOne: vi.fn(),
        save: vi.fn(async (o: Order) => ({ ...o, id: 'ord-1' })),
      };
      const service = new OrdersService(orderRepo, { emit: vi.fn() } as any);

      const dto1 = { items: [{ eventId: 'evt-1', ticketType: 'General', quantity: 1, unitPrice: 100 }] };
      const first = await service.create('user-1', dto1 as any, 'idem-diff-body');
      orderRepo.findOne.mockResolvedValue(first);

      const dto2 = { items: [{ eventId: 'evt-1', ticketType: 'VIP', quantity: 2, unitPrice: 200 }] };
      await expect(service.create('user-1', dto2 as any, 'idem-diff-body')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('bloquea la orden en PROCESSING antes de cobrar e impide doble cobro concurrente', async () => {
      const order = new Order();
      order.id = 'ord-lock';
      order.userId = 'user-1';
      order.status = OrderStatus.PENDING;
      order.version = 1;
      order.total = 5000;
      order.holds = [];
      order.items = [];

      const orderRepo: any = {
        findOne: vi.fn(async () => order),
        save: vi.fn(async (o: Order) => o),
        update: vi.fn(async () => ({ affected: 1 })),
      };

      const qb = {
        setLock: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getOne: vi.fn(async () => order),
      };
      const manager: any = {
        getRepository: vi.fn(() => ({
          createQueryBuilder: () => qb,
          find: vi.fn(async () => []),
          save: vi.fn(async (o: Order) => o),
        })),
      };
      const dataSource: any = {
        transaction: vi.fn(async (cb: any) => cb(manager)),
      };
      const payments: any = {
        processPayment: vi.fn(async () => {
          // Simula demora de red durante el cobro SOAP; una 2da petición llega mientras está PROCESSING.
          await expect(
            service.pay('ord-lock', { sub: 'user-1', email: 'u@test.com' }, '4111 1111 1111 1111'),
          ).rejects.toThrow(ConflictException);
          return true;
        }),
      };
      const outbox: any = { enqueue: vi.fn(async () => ({ id: 'outbox-paid' })) };

      const service = new OrdersService(
        orderRepo,
        { emit: vi.fn() } as any,
        undefined,
        undefined,
        undefined,
        payments,
        undefined,
        outbox,
        dataSource,
      );

      const paid = await service.pay('ord-lock', { sub: 'user-1', email: 'u@test.com' }, '4111 1111 1111 1111');
      expect(paid.status).toBe(OrderStatus.PAID);
      expect(payments.processPayment).toHaveBeenCalledTimes(1);
      expect(outbox.enqueue).toHaveBeenCalledWith('order.paid', expect.any(Object), manager);
    });
  });

  describe('3. Deduplicación persistente tras reinicio de la API (NotificationsService)', () => {
    it('descarta duplicados aunque se reinicie el servicio (nueva instancia sin caché en memoria)', async () => {
      const dbRows = new Map<string, any>();
      const repo: any = {
        findOne: vi.fn(async ({ where }: any) => dbRows.get(where.messageId) ?? null),
        create: vi.fn((data: any) => ({ ...data, id: `notif-${dbRows.size + 1}` })),
        save: vi.fn(async (entity: any) => {
          if (entity.messageId && dbRows.has(entity.messageId)) {
            const err: any = new Error('duplicate key');
            err.driverError = { code: '23505' };
            throw err;
          }
          if (entity.messageId) dbRows.set(entity.messageId, entity);
          return entity;
        }),
      };

      const instanceBeforeRestart = new NotificationsService(repo);
      const first = await instanceBeforeRestart.processIncomingMessage(
        'order.paid',
        { orderId: 'ord-1', userEmail: 'cliente@eventhub.com' },
        'msg-persist-1',
      );
      expect(first.status).toBe('PROCESSED');
      expect(dbRows.size).toBe(1);

      // Reinicio simulado: nueva instancia con processedMessageKeys vacío
      const instanceAfterRestart = new NotificationsService(repo);
      const second = await instanceAfterRestart.processIncomingMessage(
        'order.paid',
        { orderId: 'ord-1', userEmail: 'cliente@eventhub.com' },
        'msg-persist-1',
      );
      expect(second.status).toBe('DUPLICATE_SKIPPED');
      expect(dbRows.size).toBe(1);
    });
  });

  describe('4. Validación de Luhn y respuestas 409 ante conflictos de base de datos', () => {
    it('rechaza tarjeta que falla Luhn en PaymentsService', async () => {
      const payments = new PaymentsService();
      const res = await payments.processPayment({
        orderId: 'ord-luhn',
        amount: 500,
        cardNumber: '4500 0000 0000 0000',
      });
      expect(res.success).toBe(false);
      expect(res.code).toBe('INVALID_CARD');
    });

    it('EventsService.remove responde 409 Conflict si hay órdenes o entradas asociadas (FK 23503)', async () => {
      const eventDao: any = {
        delete: vi.fn(async () => {
          const err: any = new Error('update or delete on table "events" violates foreign key constraint');
          err.driverError = { code: '23503' };
          throw err;
        }),
      };
      const service = new EventsService(eventDao, new EventFactory());
      await expect(service.remove('evt-with-orders')).rejects.toThrow(ConflictException);
    });

    it('ProblemDetailsFilter mapea errores 23503 y 23505 de PostgreSQL a 409 Conflict sin filtrar SQL', () => {
      const filter = new ProblemDetailsFilter();
      const response = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const host: any = {
        switchToHttp: () => ({
          getResponse: () => response,
          getRequest: () => ({ originalUrl: '/events/evt-1', url: '/events/evt-1' }),
        }),
      };
      vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

      const fkErr: any = new Error('violates foreign key constraint "FK_orders_event"');
      fkErr.driverError = { code: '23503' };

      filter.catch(fkErr, host);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 409,
          title: 'Conflict',
        }),
      );
      expect(JSON.stringify(response.json.mock.calls[0][0])).not.toContain('FK_orders_event');
    });
  });
});

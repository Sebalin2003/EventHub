import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { Order, OrderStatus } from './entities/order.entity.js';
import { OrderItem } from './entities/order-item.entity.js';
import { EventStatus } from '../events/entities/event.entity.js';

const buyer = { sub: 'user-1', email: 'buyer@eventhub.com' };

function makeEvent(overrides: Record<string, any> = {}) {
  return {
    id: 'evt-1',
    legacyId: 'e1',
    title: 'Argentina Tech Summit',
    status: EventStatus.PUBLISHED,
    ticketTypes: [
      { id: 'tt-1', name: 'General', price: 85000, totalQuantity: 10, sold: 2 },
      { id: 'tt-2', name: 'VIP', price: 175000, totalQuantity: 5, sold: 0 },
    ],
    ...overrides,
  };
}

describe('OrdersService - cobertura de flujo de negocio (Eje B)', () => {
  let service: OrdersService;
  let orderRepo: any;
  let rabbitClient: any;
  let eventDao: any;
  let eventsService: any;
  let inventory: any;
  let payments: any;
  let tickets: any;

  beforeEach(() => {
    orderRepo = {
      save: vi.fn(async (order: any) => ({ ...order, id: order.id ?? 'order-123' })),
      findOne: vi.fn(),
      find: vi.fn(),
    };
    rabbitClient = { emit: vi.fn() };
    eventDao = { findOne: vi.fn(async () => makeEvent()) };
    eventsService = { registerSale: vi.fn(async () => undefined) };
    inventory = {
      createHold: vi.fn(async () => ({ id: 'hold-1', expiresAt: '2026-01-01T00:00:00.000Z' })),
      isHoldActive: vi.fn(() => true),
      releaseHold: vi.fn(async () => undefined),
      commitHold: vi.fn(async () => undefined),
    };
    payments = { processPayment: vi.fn(async () => true) };
    tickets = { emit: vi.fn(async () => [{ code: 'EVT-AAA' }, { code: 'EVT-BBB' }]) };

    service = new OrdersService(
      orderRepo,
      rabbitClient,
      eventDao,
      eventsService,
      inventory,
      payments,
      tickets,
    );
  });

  describe('create con validación de evento e inventario', () => {
    it('agrupa líneas repetidas, calcula subtotales y toma holds por evento', async () => {
      const result = await service.create(buyer, {
        items: [
          { eventId: 'evt-1', ticketType: 'tt-1', quantity: 1 },
          { eventId: 'evt-1', ticketType: 'General', quantity: 2 },
        ],
      } as any, 'idem-1');

      expect(result.total).toBe(3 * 85000);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].quantity).toBe(3);
      expect(result.holds).toEqual([
        { eventId: 'evt-1', holdId: 'hold-1', expiresAt: '2026-01-01T00:00:00.000Z' },
      ]);
      expect(inventory.createHold).toHaveBeenCalledWith('evt-1', 'user-1', 3);
      expect(rabbitClient.emit).toHaveBeenCalledWith(
        'order.created',
        expect.objectContaining({ userEmail: 'buyer@eventhub.com', expiresAt: '2026-01-01T00:00:00.000Z' }),
      );
    });

    it('rechaza un evento inexistente con 400', async () => {
      eventDao.findOne.mockResolvedValue(null);

      await expect(
        service.create('user-1', { items: [{ eventId: 'missing', ticketType: 'General', quantity: 1 }] } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza un evento que no está publicado con 400', async () => {
      eventDao.findOne.mockResolvedValue(makeEvent({ status: EventStatus.DRAFT }));

      await expect(
        service.create('user-1', { items: [{ eventId: 'evt-1', ticketType: 'General', quantity: 1 }] } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza un tipo de entrada inexistente con 400', async () => {
      await expect(
        service.create('user-1', { items: [{ eventId: 'evt-1', ticketType: 'Gold', quantity: 1 }] } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza stock insuficiente con 409', async () => {
      await expect(
        service.create('user-1', { items: [{ eventId: 'evt-1', ticketType: 'tt-2', quantity: 6 }] } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('libera los holds ya tomados si falla una reserva posterior', async () => {
      eventDao.findOne
        .mockResolvedValueOnce(makeEvent())
        .mockResolvedValueOnce(makeEvent({ id: 'evt-2', ticketTypes: [{ id: 'tt-9', name: 'General', price: 10, totalQuantity: 5, sold: 0 }] }));
      inventory.createHold
        .mockResolvedValueOnce({ id: 'hold-1', expiresAt: '2026-01-01T00:00:00.000Z' })
        .mockRejectedValueOnce(new ConflictException('no stock'));

      await expect(
        service.create('user-1', {
          items: [
            { eventId: 'evt-1', ticketType: 'General', quantity: 1 },
            { eventId: 'evt-2', ticketType: 'General', quantity: 1 },
          ],
        } as any),
      ).rejects.toThrow(ConflictException);

      expect(inventory.releaseHold).toHaveBeenCalledWith('evt-1', 'hold-1', 'user-1');
    });

    it('no falla si el broker no está disponible al crear la orden', async () => {
      rabbitClient.emit.mockImplementation(() => {
        throw new Error('broker down');
      });

      const result = await service.create('user-1', {
        items: [{ eventId: 'evt-1', ticketType: 'General', quantity: 1 }],
      } as any);

      expect(result.id).toBe('order-123');
    });

    it('en modo fallback calcula subtotales con precio 0 si no se informa unitPrice', async () => {
      const fallbackService = new OrdersService(orderRepo, rabbitClient);
      const result = await fallbackService.create('user-1', {
        items: [{ eventId: 'evt-1', ticketType: 'General', quantity: 2 }],
      } as any);

      expect(result.total).toBe(0);
      expect(result.holds).toEqual([]);
    });

    it('en modo fallback respeta el unitPrice informado', async () => {
      const fallbackService = new OrdersService(orderRepo, rabbitClient);
      const result = await fallbackService.create('user-1', {
        items: [{ eventId: 'evt-1', ticketType: 'General', quantity: 2, unitPrice: 500 }],
      } as any);

      expect(result.total).toBe(1000);
      expect(result.items[0]).toBeInstanceOf(OrderItem);
    });
  });

  describe('pay', () => {
    function pendingOrder(overrides: Partial<Order> = {}): Order {
      const order = new Order();
      order.id = 'ord-1';
      order.userId = 'user-1';
      order.status = OrderStatus.PENDING;
      order.version = 1;
      order.total = 85000;
      order.holds = [{ eventId: 'evt-1', holdId: 'hold-1', expiresAt: '2099-01-01T00:00:00.000Z' }];
      order.items = [Object.assign(new OrderItem(), {
        eventId: 'evt-1',
        ticketTypeId: 'tt-1',
        ticketType: 'General',
        quantity: 2,
        unitPrice: 85000,
        subtotal: 170000,
      })];
      return Object.assign(order, overrides);
    }

    it('cobra, confirma holds, registra venta y emite tickets', async () => {
      const order = pendingOrder();
      orderRepo.findOne.mockResolvedValue(order);

      const result = await service.pay('ord-1', buyer, '4500 0000 0000 0000');

      expect(payments.processPayment).toHaveBeenCalledWith(85000, '4500 0000 0000 0000');
      expect(inventory.commitHold).toHaveBeenCalledWith('evt-1', 'hold-1', 'user-1');
      expect(eventsService.registerSale).toHaveBeenCalledWith('evt-1', 'tt-1', 2);
      expect(tickets.emit).toHaveBeenCalledWith('ord-1', 'evt-1', 'user-1', 2, 'General');
      expect(result.status).toBe(OrderStatus.PAID);
      expect(result.tickets).toHaveLength(2);
      expect(rabbitClient.emit).toHaveBeenCalledWith(
        'order.paid',
        expect.objectContaining({ ticketCodes: ['EVT-AAA', 'EVT-BBB'] }),
      );
    });

    it('cancela y devuelve 410 si el hold expiró', async () => {
      const order = pendingOrder();
      orderRepo.findOne.mockResolvedValue(order);
      inventory.isHoldActive.mockReturnValue(false);

      await expect(service.pay('ord-1', buyer, '4500 0000 0000 0000')).rejects.toThrow(GoneException);
      expect(order.status).toBe(OrderStatus.CANCELLED);
      expect(payments.processPayment).not.toHaveBeenCalled();
    });

    it('cancela y devuelve 402 si el pago es rechazado', async () => {
      const order = pendingOrder();
      orderRepo.findOne.mockResolvedValue(order);
      payments.processPayment.mockResolvedValue(false);

      await expect(service.pay('ord-1', buyer, '4500 0000 0000 0000')).rejects.toMatchObject({
        status: 402,
      });
      expect(order.status).toBe(OrderStatus.CANCELLED);
      expect(inventory.releaseHold).toHaveBeenCalled();
    });

    it('rechaza pagar una orden que no está pendiente con 409', async () => {
      orderRepo.findOne.mockResolvedValue(pendingOrder({ status: OrderStatus.PAID }));

      await expect(service.pay('ord-1', buyer, '4500 0000 0000 0000')).rejects.toThrow(ConflictException);
    });

    it('propaga 404 si la orden no existe', async () => {
      orderRepo.findOne.mockResolvedValue(null);

      await expect(service.pay('ord-1', buyer, '4500 0000 0000 0000')).rejects.toThrow(NotFoundException);
    });

    it('permite pagar sin tarjeta ni pasarela (flujo directo)', async () => {
      const order = pendingOrder({ holds: [] });
      orderRepo.findOne.mockResolvedValue(order);

      const result = await service.pay('ord-1', buyer);

      expect(payments.processPayment).not.toHaveBeenCalled();
      expect(result.status).toBe(OrderStatus.PAID);
    });

    it('no falla si el broker no está disponible al confirmar el pago', async () => {
      const order = pendingOrder();
      orderRepo.findOne.mockResolvedValue(order);
      rabbitClient.emit.mockImplementation(() => {
        throw new Error('broker down');
      });

      await expect(service.pay('ord-1', buyer, '4500 0000 0000 0000')).resolves.toMatchObject({
        status: OrderStatus.PAID,
      });
    });

    it('ignora errores al liberar holds inexistentes durante la cancelación', async () => {
      const order = pendingOrder();
      orderRepo.findOne.mockResolvedValue(order);
      inventory.isHoldActive.mockReturnValue(false);
      inventory.releaseHold.mockRejectedValue(new Error('gone'));

      await expect(service.pay('ord-1', buyer, '4500 0000 0000 0000')).rejects.toThrow(GoneException);
      expect(inventory.releaseHold).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('cancela una orden pendiente y libera holds activos', async () => {
      const order = new Order();
      order.id = 'ord-1';
      order.userId = 'user-1';
      order.status = OrderStatus.PENDING;
      order.holds = [{ eventId: 'evt-1', holdId: 'hold-1', expiresAt: '2099-01-01T00:00:00.000Z' }];
      orderRepo.findOne.mockResolvedValue(order);

      const result = await service.cancel('ord-1', 'user-1');

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(inventory.releaseHold).toHaveBeenCalledWith('evt-1', 'hold-1', 'user-1');
    });

    it('rechaza cancelar una orden no pendiente con 409', async () => {
      const order = new Order();
      order.id = 'ord-1';
      order.userId = 'user-1';
      order.status = OrderStatus.PAID;
      orderRepo.findOne.mockResolvedValue(order);

      await expect(service.cancel('ord-1', 'user-1')).rejects.toThrow(ConflictException);
    });

    it('propaga 404 si la orden no existe', async () => {
      orderRepo.findOne.mockResolvedValue(null);

      await expect(service.cancel('missing', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('consultas y transiciones directas', () => {
    it('lista las órdenes del usuario ordenadas por creación', async () => {
      const orders = [new Order()];
      orderRepo.find.mockResolvedValue(orders);

      const result = await service.findAllByUser('user-1');

      expect(result).toBe(orders);
      expect(orderRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        relations: { items: true },
        order: { createdAt: 'DESC' },
      });
    });

    it('findOne rechaza con 403 el acceso de otro usuario (BOLA)', async () => {
      const order = new Order();
      order.id = 'ord-1';
      order.userId = 'owner';
      orderRepo.findOne.mockResolvedValue(order);

      await expect(service.findOne('ord-1', 'attacker')).rejects.toThrow(ForbiddenException);
    });

    it('payOrder propaga 409 ante una transición inválida', async () => {
      const order = new Order();
      order.id = 'ord-1';
      order.userId = 'user-1';
      order.status = OrderStatus.PAID;
      orderRepo.findOne.mockResolvedValue(order);

      await expect(service.payOrder('ord-1', 'user-1')).rejects.toThrow(ConflictException);
      expect(orderRepo.save).not.toHaveBeenCalled();
    });

    it('cancelOrder propaga 409 ante una transición inválida', async () => {
      const order = new Order();
      order.id = 'ord-1';
      order.userId = 'user-1';
      order.status = OrderStatus.REFUNDED;
      orderRepo.findOne.mockResolvedValue(order);

      await expect(service.cancelOrder('ord-1', 'user-1')).rejects.toThrow(ConflictException);
    });

    it('refundOrder propaga 409 ante una transición inválida', async () => {
      const order = new Order();
      order.id = 'ord-1';
      order.userId = 'user-1';
      order.status = OrderStatus.PENDING;
      orderRepo.findOne.mockResolvedValue(order);

      await expect(service.refundOrder('ord-1', 'user-1')).rejects.toThrow(ConflictException);
    });

    it('expone el status 402 como HttpException en pagos rechazados', async () => {
      const order = new Order();
      order.id = 'ord-1';
      order.userId = 'user-1';
      order.status = OrderStatus.PENDING;
      order.total = 10;
      order.holds = [];
      orderRepo.findOne.mockResolvedValue(order);
      payments.processPayment.mockResolvedValue(false);

      try {
        await service.pay('ord-1', buyer, '4500 0000 0000 0000');
        expect.fail('debió rechazar');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(402);
      }
    });
  });
});

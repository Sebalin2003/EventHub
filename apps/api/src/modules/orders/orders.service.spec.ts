import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrdersService } from './orders.service.js';
import { Order, OrderStatus } from './entities/order.entity.js';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepo: any;
  let rabbitClient: any;

  beforeEach(() => {
    orderRepo = {
      save: vi.fn().mockImplementation((order: Order) => Promise.resolve({ ...order, id: 'order-123' })),
      findOne: vi.fn(),
      find: vi.fn(),
    };
    rabbitClient = {
      emit: vi.fn(),
    };
    service = new OrdersService(orderRepo, rabbitClient);
  });

  describe('create', () => {
    it('debe calcular el total y crear la orden en estado PENDING', async () => {
      const dto = {
        items: [
          { eventId: 'evt-1', ticketType: 'VIP', quantity: 2, unitPrice: 5000 },
          { eventId: 'evt-1', ticketType: 'General', quantity: 1, unitPrice: 2000 },
        ],
      };

      const result = await service.create('user-1', dto);

      expect(result.id).toBe('order-123');
      expect(result.total).toBe(12000);
      expect(result.status).toBe(OrderStatus.PENDING);
      expect(rabbitClient.emit).toHaveBeenCalledWith('order.created', expect.objectContaining({
        orderId: 'order-123',
        userId: 'user-1',
        total: 12000,
      }));
    });

    it('Eje C Idempotencia: debe devolver la orden existente si se envía la misma Idempotency-Key sin duplicar', async () => {
      const existingOrder = new Order();
      existingOrder.id = 'order-original';
      existingOrder.userId = 'user-1';
      existingOrder.idempotencyKey = 'idemp-key-xyz';
      existingOrder.total = 10000;

      orderRepo.findOne.mockResolvedValue(existingOrder);

      const dto = {
        items: [{ eventId: 'evt-1', ticketType: 'VIP', quantity: 1, unitPrice: 10000 }],
      };

      const result = await service.create('user-1', dto, 'idemp-key-xyz');

      expect(result.id).toBe('order-original');
      expect(orderRepo.save).not.toHaveBeenCalled();
      expect(rabbitClient.emit).not.toHaveBeenCalled();
    });
  });

  describe('findOne (Eje D: BOLA / IDOR)', () => {
    it('debe retornar la orden si el usuario solicitante es el propietario', async () => {
      const order = new Order();
      order.id = 'order-1';
      order.userId = 'user-owner';

      orderRepo.findOne.mockResolvedValue(order);

      const result = await service.findOne('order-1', 'user-owner');
      expect(result).toBe(order);
    });

    it('debe arrojar 403 Forbidden si el usuario solicitante no es el dueño (BOLA IDOR)', async () => {
      const order = new Order();
      order.id = 'order-1';
      order.userId = 'user-owner';

      orderRepo.findOne.mockResolvedValue(order);

      await expect(service.findOne('order-1', 'attacker-user')).rejects.toThrow(ForbiddenException);
    });

    it('debe permitir acceso si el usuario tiene rol admin', async () => {
      const order = new Order();
      order.id = 'order-1';
      order.userId = 'user-owner';

      orderRepo.findOne.mockResolvedValue(order);

      const result = await service.findOne('order-1', 'admin-user', 'admin');
      expect(result).toBe(order);
    });

    it('debe arrojar 404 NotFound si la orden no existe', async () => {
      orderRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing-order', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('payOrder, cancelOrder, refundOrder', () => {
    it('debe pagar la orden y actualizar estado a PAID', async () => {
      const order = new Order();
      order.id = 'ord-1';
      order.userId = 'u-1';
      order.status = OrderStatus.PENDING;
      order.version = 1;

      orderRepo.findOne.mockResolvedValue(order);

      const updated = await service.payOrder('ord-1', 'u-1');
      expect(updated.status).toBe(OrderStatus.PAID);
      expect(orderRepo.save).toHaveBeenCalledWith(order);
    });

    it('debe cancelar la orden y actualizar estado a CANCELLED', async () => {
      const order = new Order();
      order.id = 'ord-1';
      order.userId = 'u-1';
      order.status = OrderStatus.PENDING;
      order.version = 1;

      orderRepo.findOne.mockResolvedValue(order);

      const updated = await service.cancelOrder('ord-1', 'u-1');
      expect(updated.status).toBe(OrderStatus.CANCELLED);
      expect(orderRepo.save).toHaveBeenCalledWith(order);
    });

    it('debe reembolsar una orden pagada y actualizar estado a REFUNDED', async () => {
      const order = new Order();
      order.id = 'ord-1';
      order.userId = 'u-1';
      order.status = OrderStatus.PAID;
      order.version = 1;

      orderRepo.findOne.mockResolvedValue(order);

      const updated = await service.refundOrder('ord-1', 'u-1');
      expect(updated.status).toBe(OrderStatus.REFUNDED);
      expect(orderRepo.save).toHaveBeenCalledWith(order);
    });
  });
});

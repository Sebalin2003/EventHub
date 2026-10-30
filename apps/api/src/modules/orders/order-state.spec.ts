import { describe, it, expect } from 'vitest';
import { ConflictException } from '@nestjs/common';
import { Order, OrderStatus } from './entities/order.entity.js';
import { createOrderState } from './state/order-state.js';

describe('Order State Pattern (Eje B: Transiciones de Estado y 409 Conflict)', () => {
  it('debe iniciar en estado PENDING', () => {
    const order = new Order();
    order.status = OrderStatus.PENDING;
    expect(order.status).toBe(OrderStatus.PENDING);
  });

  describe('Transiciones Válidas', () => {
    it('PENDING -> PAID: debe pagar exitosamente una orden pendiente', () => {
      const order = new Order();
      order.status = OrderStatus.PENDING;
      order.version = 1;

      order.pay();

      expect(order.status).toBe(OrderStatus.PAID);
      expect(order.version).toBe(2);
    });

    it('PENDING -> CANCELLED: debe cancelar exitosamente una orden pendiente', () => {
      const order = new Order();
      order.status = OrderStatus.PENDING;
      order.version = 1;

      order.cancel();

      expect(order.status).toBe(OrderStatus.CANCELLED);
      expect(order.version).toBe(2);
    });

    it('PAID -> REFUNDED: debe reembolsar exitosamente una orden pagada', () => {
      const order = new Order();
      order.status = OrderStatus.PAID;
      order.version = 1;

      order.refund();

      expect(order.status).toBe(OrderStatus.REFUNDED);
      expect(order.version).toBe(2);
    });
  });

  describe('Transiciones Inválidas (Debe arrojar 409 ConflictException)', () => {
    const invalidTransitions: Array<{
      initialState: OrderStatus;
      action: 'pay' | 'cancel' | 'refund';
      description: string;
    }> = [
      {
        initialState: OrderStatus.PENDING,
        action: 'refund',
        description: 'No se puede reembolsar una orden PENDING (no pagada)',
      },
      {
        initialState: OrderStatus.PAID,
        action: 'pay',
        description: 'No se puede pagar una orden ya pagada (PAID)',
      },
      {
        initialState: OrderStatus.PAID,
        action: 'cancel',
        description: 'No se puede cancelar directamente una orden PAID (debe reembolsarse)',
      },
      {
        initialState: OrderStatus.CANCELLED,
        action: 'pay',
        description: 'No se puede pagar una orden cancelada (CANCELLED)',
      },
      {
        initialState: OrderStatus.CANCELLED,
        action: 'cancel',
        description: 'No se puede re-cancelar una orden cancelada (CANCELLED)',
      },
      {
        initialState: OrderStatus.CANCELLED,
        action: 'refund',
        description: 'No se puede reembolsar una orden cancelada (CANCELLED)',
      },
      {
        initialState: OrderStatus.REFUNDED,
        action: 'pay',
        description: 'No se puede pagar una orden ya reembolsada (REFUNDED)',
      },
      {
        initialState: OrderStatus.REFUNDED,
        action: 'cancel',
        description: 'No se puede cancelar una orden ya reembolsada (REFUNDED)',
      },
      {
        initialState: OrderStatus.REFUNDED,
        action: 'refund',
        description: 'No se puede volver a reembolsar una orden reembolsada (REFUNDED)',
      },
    ];

    test.each(invalidTransitions)(
      'Desde $initialState ejecutando $action() debe arrojar 409 Conflict: $description',
      ({ initialState, action }) => {
        const order = new Order();
        order.status = initialState;
        order.version = 1;

        expect(() => {
          order[action]();
        }).toThrow(ConflictException);

        try {
          order[action]();
        } catch (error: any) {
          expect(error).toBeInstanceOf(ConflictException);
          expect(error.getStatus()).toBe(409);
        }
      },
    );
  });
});

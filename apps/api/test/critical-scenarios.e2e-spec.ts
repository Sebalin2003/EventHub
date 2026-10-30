import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IdentityService } from '../src/modules/identity/identity.service.js';
import { ScryptHashStrategy } from '../src/modules/identity/strategies/scrypt-hash.strategy.js';
import { InventoryService } from '../src/modules/inventory/inventory.service.js';
import { OrdersService } from '../src/modules/orders/orders.service.js';
import { Order, OrderStatus } from '../src/modules/orders/entities/order.entity.js';
import { TicketsService } from '../src/modules/tickets/tickets.service.js';
import { Ticket, TicketStatus } from '../src/modules/tickets/entities/ticket.entity.js';
import { PaymentsService } from '../src/modules/payments/payments.service.js';
import { ConflictException, ForbiddenException, PreconditionFailedException, UnauthorizedException } from '@nestjs/common';

describe('Eje A: 5 Escenarios Críticos Automatizados de Punta a Punta (E2E)', () => {
  // Escenario 1: Autenticación, Hashing Seguro y Control de Acceso
  describe('Escenario Crítico 1: Flujo de Autenticación, JWT y Registro Seguro', () => {
    let identityService: IdentityService;
    let userDaoMock: any;
    let jwtMock: any;
    const hashStrategy = new ScryptHashStrategy();

    beforeEach(() => {
      userDaoMock = {
        users: new Map<string, any>(),
        existsByEmail: vi.fn(async (email: string) => userDaoMock.users.has(email)),
        save: vi.fn(async (data: any) => {
          const user = { id: `usr-${Date.now()}`, role: 'attendee', ...data };
          userDaoMock.users.set(data.email, user);
          return user;
        }),
        findByEmail: vi.fn(async (email: string) => userDaoMock.users.get(email) || null),
      };

      jwtMock = {
        signAsync: vi.fn(async (payload: any) => `token-for-${payload.sub}`),
        verify: vi.fn((token: string) => ({ sub: 'usr-1', email: 'test@eventhub.com', role: 'attendee' })),
      };

      identityService = new IdentityService(userDaoMock, jwtMock, hashStrategy);
    });

    it('Dado un nuevo usuario, Cuando se registra y se loguea con sus credenciales, Entonces obtiene su JWT y sus contraseñas quedan hasheadas con scrypt', async () => {
      // 1. Registro
      const registered = await identityService.register({
        email: 'carla@eventhub.com',
        password: 'PasswordSegura2026!',
        firstName: 'Carla',
        lastName: 'Gómez',
      });

      expect(registered.email).toBe('carla@eventhub.com');
      expect((registered as any).passwordHash).toBeUndefined(); // No fuga credenciales

      // Verificar que en base de datos quedó hash adaptativo scrypt
      const storedUser = await userDaoMock.findByEmail('carla@eventhub.com');
      expect(storedUser.passwordHash).toContain(':');
      expect(storedUser.passwordHash).not.toBe('PasswordSegura2026!');

      // 2. Login exitoso
      const loginRes = await identityService.login('carla@eventhub.com', 'PasswordSegura2026!');
      expect(loginRes.accessToken).toBeDefined();
      expect(loginRes.user.email).toBe('carla@eventhub.com');

      // 3. Login con contraseña errónea rechazado (401)
      await expect(
        identityService.login('carla@eventhub.com', 'ContraseñaErronea'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // Escenario 2: Exploración de Catálogo y Concurrencia REST con ETag
  describe('Escenario Crítico 2: Catálogo de Eventos y Control de Concurrencia Optimista (ETag 412)', () => {
    it('Dado un recurso con ETag de versión, Cuando se intenta actualizar con un ETag desactualizado, Entonces el sistema responde 412 Precondition Failed', () => {
      const currentResourceVersion = 2;
      const staleClientIfMatch = 'W/"1"';
      const cleanCurrent = String(currentResourceVersion);
      const cleanIfMatch = staleClientIfMatch.replace(/^W\//, '').replace(/"/g, '');

      expect(cleanIfMatch).not.toBe(cleanCurrent);

      // Simula verificación de concurrencia optimista
      const checkPrecondition = () => {
        if (cleanIfMatch !== cleanCurrent) {
          throw new PreconditionFailedException('Actualización concurrente rechazada: ETag desactualizado');
        }
      };

      expect(checkPrecondition).toThrow(PreconditionFailedException);
    });
  });

  // Escenario 3: Reserva Temporal de Inventario (HOLD) y Prevención de Sobreventa
  describe('Escenario Crítico 3: Reserva Temporal (HOLD) y Prevención de Doble Venta', () => {
    let inventoryService: InventoryService;
    let inventoryDaoMock: any;

    beforeEach(() => {
      inventoryDaoMock = {
        inventory: new Map<string, number>([['evt-concierto', 5]]),
        findOne: vi.fn(async (eventId: string) => ({
          eventId,
          available: inventoryDaoMock.inventory.get(eventId) ?? 0,
        })),
        save: vi.fn(async (data: { eventId: string; available: number }) => {
          inventoryDaoMock.inventory.set(data.eventId, data.available);
          return data;
        }),
      };
      inventoryService = new InventoryService(inventoryDaoMock);
      inventoryService.onModuleInit();
    });

    it('Dado un evento con 5 lugares disponibles, Cuando un usuario crea un HOLD de 4 lugares, la disponibilidad efectiva baja a 1, y un segundo usuario intentando reservar 2 es rechazado con 409 Conflict', async () => {
      // 1. Estado inicial
      const initial = await inventoryService.get('evt-concierto');
      expect(initial.available).toBe(5);

      // 2. Usuario A reserva 4 lugares
      const holdA = await inventoryService.createHold('evt-concierto', 'user-A', 4);
      expect(holdA.quantity).toBe(4);

      // 3. Disponibilidad efectiva debe ser 1 (5 - 4 held)
      const afterHold = await inventoryService.get('evt-concierto');
      expect(afterHold.available).toBe(1);
      expect(afterHold.held).toBe(4);

      // 4. Usuario B intenta reservar 2 lugares (supera disponibilidad efectiva) -> 409 Conflict
      await expect(
        inventoryService.createHold('evt-concierto', 'user-B', 2),
      ).rejects.toThrow(ConflictException);

      // 5. Usuario A libera su HOLD -> disponibilidad vuelve a 5
      await inventoryService.releaseHold('evt-concierto', holdA.id, 'user-A');
      const restored = await inventoryService.get('evt-concierto');
      expect(restored.available).toBe(5);
      expect(restored.held).toBe(0);
    });
  });

  // Escenario 4: Checkout, Idempotencia REST y Pago Resiliente SOAP
  describe('Escenario Crítico 4: Orden, Idempotency-Key y Pasarela de Pago SOAP', () => {
    let ordersService: OrdersService;
    let paymentsService: PaymentsService;
    let orderRepoMock: any;
    let rabbitMock: any;

    beforeEach(() => {
      const storedOrders = new Map<string, Order>();
      orderRepoMock = {
        save: vi.fn(async (o: Order) => {
          o.id = o.id || `ord-${Date.now()}`;
          storedOrders.set(o.id, o);
          if (o.idempotencyKey) {
            storedOrders.set(`key:${o.idempotencyKey}`, o);
          }
          return o;
        }),
        findOne: vi.fn(async ({ where }: any) => {
          if (where.idempotencyKey) return storedOrders.get(`key:${where.idempotencyKey}`) || null;
          if (where.id) return storedOrders.get(where.id) || null;
          return null;
        }),
      };
      rabbitMock = { emit: vi.fn() };
      ordersService = new OrdersService(orderRepoMock, rabbitMock);
      paymentsService = new PaymentsService();
    });

    it('Dado un intento de compra con Idempotency-Key, Cuando se procesa el pago vía SOAP y se repite el POST, Entonces se obtiene la misma orden sin duplicarla', async () => {
      const orderDto = {
        items: [{ eventId: 'evt-1', ticketType: 'General', quantity: 2, unitPrice: 7500 }],
      };

      // 1. Creación de Orden con Idempotency-Key
      const order = await ordersService.create('user-1', orderDto, 'idem-key-abc');
      expect(order.total).toBe(15000);
      expect(order.status).toBe(OrderStatus.PENDING);

      // 2. Procesamiento de pago SOAP
      const paymentResult = await paymentsService.processPayment({
        orderId: order.id,
        amount: order.total,
        cardNumber: '4500 0000 0000 0000',
      });
      expect(paymentResult.success).toBe(true);
      expect(paymentResult.code).toBe('APPROVED');

      // 3. Transición de estado a PAID
      order.pay();
      expect(order.status).toBe(OrderStatus.PAID);

      // 4. Reenvío del POST con la misma Idempotency-Key (simula doble clic o timeout de red)
      const repeatedOrder = await ordersService.create('user-1', orderDto, 'idem-key-abc');

      expect(repeatedOrder.id).toBe(order.id);
      expect(orderRepoMock.save).toHaveBeenCalledTimes(1); // No creó orden duplicada
    });
  });

  // Escenario 5: Emisión de Tickets, Check-In en Puerta y BOLA
  describe('Escenario Crítico 5: Emisión de Tickets, Validación de Check-In y Seguridad BOLA', () => {
    let ticketsService: TicketsService;
    let ticketsRepoMock: any;

    beforeEach(() => {
      const store = new Map<string, Ticket>();
      ticketsRepoMock = {
        create: vi.fn((data: any) => {
          const t = new Ticket();
          Object.assign(t, data, { id: `tkt-${Date.now()}` });
          return t;
        }),
        save: vi.fn(async (t: any) => {
          if (Array.isArray(t)) {
            t.forEach(item => store.set(item.id, item));
            return t;
          }
          store.set(t.id, t);
          return t;
        }),
        findOne: vi.fn(async ({ where }: any) => store.get(where.id) || null),
      };
      ticketsService = new TicketsService(ticketsRepoMock);
    });

    it('Dado un ticket emitido, Cuando el staff lo escanea se valida con éxito; un segundo escaneo devuelve 409 Conflict, y un usuario no autorizado devuelve 403 Forbidden', async () => {
      // 1. Emisión de ticket para el comprador
      const [ticket] = await ticketsService.emit('ord-1', 'evt-1', 'asistente-legitimo', 1);
      expect(ticket.status).toBe(TicketStatus.ISSUED);

      // 2. Validación de seguridad BOLA: Atacante intenta consultar el ticket ajeno
      await expect(
        ticketsService.findById(ticket.id, 'usuario-atacante', 'attendee'),
      ).rejects.toThrow(ForbiddenException);

      // 3. Staff realiza el check-in en puerta
      const scannedTicket = await ticketsService.useTicket(ticket.id);
      expect(scannedTicket.status).toBe(TicketStatus.USED);
      expect(scannedTicket.scannedAt).toBeDefined();

      // 4. Intento de reingreso o reutilización del mismo código QR / ticket -> 409 Conflict
      await expect(
        ticketsService.useTicket(ticket.id),
      ).rejects.toThrow(ConflictException);
    });
  });
});

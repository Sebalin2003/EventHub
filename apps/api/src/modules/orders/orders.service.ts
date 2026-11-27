import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GatewayTimeoutException,
  GoneException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
  PreconditionFailedException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { Repository, type DataSource, type EntityManager } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { Order, OrderStatus } from './entities/order.entity.js';
import { OrderItem } from './entities/order-item.entity.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { EventDao } from '../events/event.dao.js';
import { EventsService } from '../events/events.service.js';
import { EventStatus } from '../events/entities/event.entity.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { PaymentsService } from '../payments/payments.service.js';
import { TicketsService } from '../tickets/tickets.service.js';
import { OutboxService } from '../../common/broker/outbox.service.js';
import { UserRole } from '../identity/entities/user.entity.js';
import { TicketStatus } from '../tickets/entities/ticket.entity.js';

export type Buyer = { sub: string; email: string };
export type Actor = { sub: string; role?: string };

/**
 * Flujo de compra: crear orden (toma HOLD de inventario, precios del servidor)
 * → pagar (adapter SOAP) → confirmar HOLD, registrar venta y emitir tickets.
 */
@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @Inject('NOTIFICATIONS_SERVICE') private rabbitClient: ClientProxy,
    @Optional() private readonly eventDao?: EventDao,
    @Optional() private readonly eventsService?: EventsService,
    @Optional() private readonly inventory?: InventoryService,
    @Optional() private readonly payments?: PaymentsService,
    @Optional() private readonly tickets?: TicketsService,
    @Optional() private readonly outbox?: OutboxService,
    @Optional() private readonly dataSource?: DataSource,
  ) {}

  private async runInTransaction<T>(work: (manager?: EntityManager) => Promise<T>): Promise<T> {
    if (this.dataSource) {
      return this.dataSource.transaction(manager => work(manager));
    }
    return work(undefined);
  }

  private computeIdempotencyHash(dto: CreateOrderDto): string {
    const normalized = (dto.items ?? [])
      .map(item => ({
        eventId: item.eventId,
        ticketType: item.ticketType,
        quantity: item.quantity,
      }))
      .sort((a, b) => `${a.eventId}:${a.ticketType}`.localeCompare(`${b.eventId}:${b.ticketType}`));
    return createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
  }

  /**
   * Publica por outbox cuando esta disponible (no se pierde si el broker cae).
   * En tests unitarios sin outbox conserva el emit directo historico.
   */
  private async publish(topic: string, payload: Record<string, unknown>, manager?: EntityManager) {
    if (this.outbox) {
      await this.outbox.enqueue(topic, payload, manager);
      return;
    }
    try {
      this.rabbitClient.emit(topic, payload);
    } catch (err) {
      this.logger.warn(`Failed to emit ${topic} to broker: ${err}`);
    }
  }

  async create(
    buyerOrUserId: string | Buyer,
    createOrderDto: CreateOrderDto,
    idempotencyKey?: string,
  ): Promise<Order> {
    const userId = typeof buyerOrUserId === 'string' ? buyerOrUserId : buyerOrUserId.sub;
    const userEmail = typeof buyerOrUserId === 'string' ? 'user@example.com' : buyerOrUserId.email;

    const idempotencyHash = idempotencyKey ? this.computeIdempotencyHash(createOrderDto) : undefined;

    // REST Idempotency: Check if an order with this idempotency key already exists
    if (idempotencyKey) {
      const existing = await this.orderRepo.findOne({
        where: { idempotencyKey, userId },
        relations: { items: true },
      });
      if (existing) {
        if (existing.idempotencyHash && existing.idempotencyHash !== idempotencyHash) {
          throw new UnprocessableEntityException('Idempotency-Key reused with a different request payload');
        }
        this.logger.log(`Idempotent request detected. Returning existing order ${existing.id} for key ${idempotencyKey}`);
        return existing;
      }
    }

    let items: OrderItem[] = [];
    const holds: Order['holds'] = [];

    // Si eventDao e inventory están disponibles, usamos la lógica de validación de eventos y stock
    if (this.eventDao && this.inventory) {
      const lines = new Map<string, OrderItem>();
      for (const itemDto of createOrderDto.items) {
        const event = await this.eventDao.findOne(itemDto.eventId);
        if (!event || event.status !== EventStatus.PUBLISHED) {
          throw new BadRequestException(`Event "${event?.title || itemDto.eventId}" is not on sale`);
        }
        // La venta cierra cuando el evento empieza: no se venden entradas de eventos ya realizados.
        if (event.date && new Date(event.date).getTime() <= Date.now()) {
          throw new ConflictException(`Event "${event.title}" has already started; tickets are no longer on sale`);
        }
        const ticketType = event.ticketTypes?.find(ticket => ticket.id === itemDto.ticketType || ticket.name === itemDto.ticketType);
        if (!ticketType) {
          throw new BadRequestException(`Ticket type "${itemDto.ticketType}" does not exist for event "${event.title}"`);
        }

        const key = `${event.id}:${ticketType.id}`;
        const item = lines.get(key) ?? Object.assign(new OrderItem(), {
          eventId: event.id,
          ticketTypeId: ticketType.id,
          ticketType: ticketType.name,
          quantity: 0,
          unitPrice: Number(ticketType.price),
        });
        item.quantity += itemDto.quantity;
        if (item.quantity > ticketType.totalQuantity - ticketType.sold) {
          throw new ConflictException(`Not enough "${ticketType.name}" tickets available`);
        }
        item.subtotal = item.quantity * item.unitPrice;
        lines.set(key, item);
      }
      items = [...lines.values()];

      try {
        for (const item of items) {
          const hold = await this.inventory.createHold(
            item.eventId,
            userId,
            item.quantity,
            undefined,
            item.ticketTypeId ?? undefined,
          );
          holds.push({ eventId: item.eventId, holdId: hold.id, expiresAt: hold.expiresAt });
        }
      } catch (error) {
        await this.releaseHolds(holds, userId);
        throw error;
      }
    } else {
      // Fallback para tests unitarios y llamadas directas
      items = createOrderDto.items.map(itemDto => {
        const item = new OrderItem();
        item.eventId = itemDto.eventId;
        item.ticketType = itemDto.ticketType;
        item.quantity = itemDto.quantity;
        item.unitPrice = itemDto.unitPrice ?? 0;
        item.subtotal = item.quantity * item.unitPrice;
        return item;
      });
    }

    const order = new Order();
    order.userId = userId;
    order.items = items;
    order.holds = holds;
    order.total = items.reduce((sum, item) => sum + (item.subtotal || item.quantity * item.unitPrice), 0);
    order.status = OrderStatus.PENDING;
    order.idempotencyKey = idempotencyKey;
    order.idempotencyHash = idempotencyHash;
    order.version = 1;

    let savedOrder: Order;
    try {
      savedOrder = await this.runInTransaction(async manager => {
        const repo = manager ? manager.getRepository(Order) : this.orderRepo;
        const persisted = await repo.save(order);
        await this.publish('order.created', {
          orderId: persisted.id,
          userId,
          userEmail,
          total: Number(persisted.total),
          status: persisted.status,
          expiresAt: holds[0]?.expiresAt,
        }, manager);
        return persisted;
      });
    } catch (error: any) {
      const code = error?.driverError?.code ?? error?.code;
      if (code === '23505' && idempotencyKey) {
        await this.releaseHolds(holds, userId);
        const existing = await this.orderRepo.findOne({
          where: { idempotencyKey, userId },
          relations: { items: true },
        });
        if (existing) {
          if (existing.idempotencyHash && existing.idempotencyHash !== idempotencyHash) {
            throw new UnprocessableEntityException('Idempotency-Key reused with a different request payload');
          }
          return existing;
        }
      }
      await this.releaseHolds(holds, userId);
      throw error;
    }

    this.logger.log(`Order created: ${savedOrder.id} for user ${userId}`);
    return savedOrder;
  }

  async pay(orderId: string, buyer: Buyer, card?: string) {
    const userId = buyer.sub;

    // Fase 1: Bloquear la orden con FOR UPDATE antes de cobrar para evitar doble cobro concurrente.
    let order: Order;
    if (this.dataSource) {
      order = await this.dataSource.transaction(async manager => {
        const locked = await manager
          .getRepository(Order)
          .createQueryBuilder('order')
          .setLock('pessimistic_write')
          .where('order.id = :id', { id: orderId })
          .getOne();

        if (!locked) throw new NotFoundException('Order not found');
        if (locked.userId !== userId) {
          throw new ForbiddenException('Acceso denegado: No posee permisos para acceder a este recurso');
        }
        if (locked.status === OrderStatus.PROCESSING) {
          throw new ConflictException('Order payment is already in progress');
        }
        if (locked.status !== OrderStatus.PENDING) {
          throw new ConflictException(`Order is already ${locked.status}`);
        }

        locked.items = await manager.getRepository(OrderItem).find({ where: { orderId } });

        if (this.inventory && locked.holds && locked.holds.length > 0) {
          if (locked.holds.some(hold => !this.inventory!.isHoldActive(hold.holdId, userId))) {
            await this.cancelPending(locked, manager);
            throw new GoneException('Reservation expired; the order was cancelled');
          }
        }

        locked.startProcessing();
        return manager.getRepository(Order).save(locked);
      });
    } else {
      order = await this.findOne(orderId, userId);
      if (!order) throw new NotFoundException('Order not found');
      if (order.status !== OrderStatus.PENDING) {
        throw new ConflictException(`Order is already ${order.status}`);
      }
      if (this.inventory && order.holds && order.holds.length > 0) {
        if (order.holds.some(hold => !this.inventory!.isHoldActive(hold.holdId, userId))) {
          await this.cancelPending(order);
          throw new GoneException('Reservation expired; the order was cancelled');
        }
      }
    }

    // Fase 2: Cobrar en la pasarela externa con la orden ya bloqueada en PROCESSING.
    if (this.payments && card) {
      const revertToPending = async () => {
        if (order.status === OrderStatus.PROCESSING) {
          order.status = OrderStatus.PENDING;
          if (this.dataSource) {
            await this.orderRepo.update({ id: order.id, status: OrderStatus.PROCESSING }, { status: OrderStatus.PENDING });
          } else {
            await this.orderRepo.save(order);
          }
        }
      };

      if (typeof (this.payments as any).processOrderPayment === 'function') {
        let paymentRes: Awaited<ReturnType<PaymentsService['processOrderPayment']>>;
        try {
          paymentRes = await (this.payments as PaymentsService).processOrderPayment({
            orderId: order.id,
            amount: Number(order.total),
            cardNumber: card,
            cardHolder: buyer.email,
          });
        } catch (err) {
          await revertToPending();
          throw err;
        }

        if (!paymentRes.success) {
          if (paymentRes.faultType === 'TIMEOUT') {
            await revertToPending();
            throw new GatewayTimeoutException({
              statusCode: HttpStatus.GATEWAY_TIMEOUT,
              message: 'La pasarela de pagos superó el tiempo máximo de espera (5s). Tu orden permanece en estado pending para reintentar.',
              orderId: order.id,
              code: paymentRes.code,
              retryAfter: 30,
            });
          }
          if (paymentRes.faultType === 'TECHNICAL_FAULT') {
            await revertToPending();
            throw new ServiceUnavailableException({
              statusCode: HttpStatus.SERVICE_UNAVAILABLE,
              message: 'La pasarela de pagos no está disponible temporalmente. Tu orden permanece en estado pending para reintentar.',
              orderId: order.id,
              code: paymentRes.code,
              retryAfter: 30,
            });
          }
          await this.runInTransaction(manager => this.cancelPending(order, manager));
          throw new HttpException(
            { statusCode: HttpStatus.PAYMENT_REQUIRED, message: paymentRes.reason || 'Payment declined; the order was cancelled', orderId: order.id },
            HttpStatus.PAYMENT_REQUIRED,
          );
        }
      } else {
        let approved: boolean;
        try {
          approved = await this.payments.processPayment(Number(order.total), card);
        } catch (err) {
          await revertToPending();
          throw err;
        }
        if (!approved) {
          await this.runInTransaction(manager => this.cancelPending(order, manager));
          throw new HttpException(
            { statusCode: HttpStatus.PAYMENT_REQUIRED, message: 'Payment declined; the order was cancelled', orderId: order.id },
            HttpStatus.PAYMENT_REQUIRED,
          );
        }
      }
    }

    // Fase 3: Confirmar holds, pasar a PAID, registrar venta, emitir tickets y encolar outbox en la misma transacción.
    const result = await this.runInTransaction(async manager => {
      if (this.inventory && order.holds) {
        for (const hold of order.holds) {
          await this.inventory.commitHold(hold.eventId, hold.holdId, userId);
        }
      }

      order.pay();
      const repo = manager ? manager.getRepository(Order) : this.orderRepo;
      await repo.save(order);

      const tickets: any[] = [];
      if (this.eventsService && this.tickets) {
        for (const item of order.items) {
          await this.eventsService.registerSale(
            item.eventId,
            item.ticketTypeId ?? '',
            item.quantity,
            ...(manager ? [manager] : []),
          );
          tickets.push(
            ...await this.tickets.emit(
              order.id,
              item.eventId,
              userId,
              item.quantity,
              item.ticketType,
              ...(manager ? [manager] : []),
            ),
          );
        }
      }

      await this.publish('order.paid', {
        orderId: order.id,
        userId,
        userEmail: buyer.email,
        total: Number(order.total),
        ticketCodes: tickets.map(ticket => ticket.code),
      }, manager);

      return tickets;
    });

    this.logger.log(`Order paid: ${order.id} (${result.length} tickets)`);
    return { ...order, tickets: result };
  }

  async cancel(orderId: string, userId: string) {
    const order = await this.findOne(orderId, userId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.PENDING) {
      throw new ConflictException(`Only pending orders can be cancelled (current: ${order.status})`);
    }
    return this.cancelPending(order);
  }

  async findAllByUser(userId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { userId },
      relations: { items: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string, role?: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // OWASP BOLA / IDOR Verification
    if (order.userId !== userId && role !== 'admin') {
      throw new ForbiddenException('Acceso denegado: No posee permisos para acceder a este recurso');
    }

    return order;
  }

  async payOrder(id: string, userId: string): Promise<Order> {
    const order = await this.findOne(id, userId);
    order.pay();
    return this.orderRepo.save(order);
  }

  async cancelOrder(id: string, userId: string): Promise<Order> {
    const order = await this.findOne(id, userId);
    if (this.inventory && order.holds && order.status === OrderStatus.PENDING) {
      await this.releaseHolds(order.holds, order.userId);
    }
    order.cancel();
    return this.orderRepo.save(order);
  }

  /**
   * Reembolso (Eje D / patrón State). Solo lo puede hacer un administrador o el organizador
   * dueño de todos los eventos de la orden: el comprador no se reembolsa a sí mismo.
   * Cancela las entradas sin usar y devuelve el cupo dentro de la misma transacción ACID + Outbox.
   */
  async refundOrder(id: string, actor: Actor, expectedVersion?: string): Promise<Order> {
    return this.runInTransaction(async manager => {
      const repo = manager ? manager.getRepository(Order) : this.orderRepo;
      const order = manager
        ? await repo.createQueryBuilder('order').setLock('pessimistic_write').where('order.id = :id', { id }).getOne()
        : await repo.findOne({ where: { id }, relations: { items: true } });

      if (!order) throw new NotFoundException(`Order with ID ${id} not found`);
      if (manager) {
        order.items = await manager.getRepository(OrderItem).find({ where: { orderId: id } });
      }

      if (actor.role !== UserRole.ADMIN) {
        const events = actor.role === UserRole.ORGANIZER && this.eventDao
          ? await Promise.all((order.items ?? []).map(item => this.eventDao!.findOne(item.eventId)))
          : [];
        const ownsAll = events.length > 0 && events.every(event => event.organizerId === actor.sub);
        if (!ownsAll) {
          throw new ForbiddenException('Only an administrator or the event organizer can refund an order');
        }
      }

      if (expectedVersion !== undefined && expectedVersion !== String(order.version)) {
        throw new PreconditionFailedException('Actualización concurrente rechazada: El ETag provisto está desactualizado.');
      }

      const issued = this.tickets ? await this.tickets.findByOrder(order.id) : [];
      if (issued.some(ticket => ticket.status === TicketStatus.USED || ticket.status === TicketStatus.SCANNED)) {
        throw new ConflictException('Cannot refund an order whose tickets were already used');
      }

      order.refund(); // State: solo PAID -> REFUNDED; cualquier otra transición responde 409.
      const saved = await repo.save(order);

      if (this.tickets) await this.tickets.cancelByOrder(order.id, ...(manager ? [manager] : []));
      for (const item of order.items ?? []) {
        if (this.eventsService) {
          await this.eventsService.releaseSale(
            item.eventId,
            item.ticketTypeId ?? '',
            item.quantity,
            ...(manager ? [manager] : []),
          );
        }
        if (this.inventory) await this.inventory.restock(item.eventId, item.quantity);
      }

      await this.publish('order.refunded', {
        orderId: order.id,
        userId: order.userId,
        total: Number(order.total),
        refundedBy: actor.sub,
      }, manager);

      this.logger.log(`Order refunded: ${order.id} by ${actor.role}`);
      return saved;
    });
  }

  private async cancelPending(order: Order, manager?: EntityManager) {
    if (this.inventory && order.holds) {
      await this.releaseHolds(order.holds, order.userId);
    }
    order.cancel();
    const repo = manager ? manager.getRepository(Order) : this.orderRepo;
    return repo.save(order);
  }

  private async releaseHolds(holds: Order['holds'], userId: string) {
    if (!this.inventory || !holds) return;
    for (const hold of holds) {
      if (!this.inventory.isHoldActive(hold.holdId, userId)) continue;
      await this.inventory.releaseHold(hold.eventId, hold.holdId, userId).catch(() => undefined);
    }
  }
}

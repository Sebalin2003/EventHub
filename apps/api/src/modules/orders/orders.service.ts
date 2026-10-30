import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

export type Buyer = { sub: string; email: string };

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
  ) {}

  async create(
    buyerOrUserId: string | Buyer,
    createOrderDto: CreateOrderDto,
    idempotencyKey?: string,
  ): Promise<Order> {
    const userId = typeof buyerOrUserId === 'string' ? buyerOrUserId : buyerOrUserId.sub;
    const userEmail = typeof buyerOrUserId === 'string' ? 'user@example.com' : buyerOrUserId.email;

    // REST Idempotency: Check if an order with this idempotency key already exists
    if (idempotencyKey) {
      const existing = await this.orderRepo.findOne({
        where: { idempotencyKey, userId },
        relations: { items: true },
      });
      if (existing) {
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

      const perEvent = new Map<string, number>();
      for (const item of items) perEvent.set(item.eventId, (perEvent.get(item.eventId) ?? 0) + item.quantity);
      try {
        for (const [eventId, quantity] of perEvent) {
          const hold = await this.inventory.createHold(eventId, userId, quantity);
          holds.push({ eventId, holdId: hold.id, expiresAt: hold.expiresAt });
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
    order.version = 1;

    const savedOrder = await this.orderRepo.save(order);

    // Emit order.created event to RabbitMQ
    try {
      this.rabbitClient.emit('order.created', {
        orderId: savedOrder.id,
        userId,
        userEmail,
        total: Number(savedOrder.total),
        status: savedOrder.status,
        expiresAt: holds[0]?.expiresAt,
      });
    } catch (err) {
      this.logger.warn(`Failed to emit order.created to broker: ${err}`);
    }

    this.logger.log(`Order created: ${savedOrder.id} for user ${userId}`);
    return savedOrder;
  }

  async pay(orderId: string, buyer: Buyer, card?: string) {
    const userId = buyer.sub;
    const order = await this.findOne(orderId, userId);
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

    if (this.payments && card) {
      const approved = await this.payments.processPayment(Number(order.total), card);
      if (!approved) {
        await this.cancelPending(order);
        throw new HttpException({ statusCode: HttpStatus.PAYMENT_REQUIRED, message: 'Payment declined; the order was cancelled', orderId: order.id }, HttpStatus.PAYMENT_REQUIRED);
      }
    }

    if (this.inventory && order.holds) {
      for (const hold of order.holds) {
        await this.inventory.commitHold(hold.eventId, hold.holdId, userId);
      }
    }

    order.pay();
    await this.orderRepo.save(order);

    const tickets: any[] = [];
    if (this.eventsService && this.tickets) {
      for (const item of order.items) {
        await this.eventsService.registerSale(item.eventId, item.ticketTypeId ?? '', item.quantity);
        tickets.push(...await this.tickets.emit(order.id, item.eventId, userId, item.quantity, item.ticketType));
      }
    }

    try {
      this.rabbitClient.emit('order.paid', {
        orderId: order.id,
        userId,
        userEmail: buyer.email,
        total: Number(order.total),
        ticketCodes: tickets.map(ticket => ticket.code),
      });
    } catch (err) {
      this.logger.warn(`Failed to emit order.paid: ${err}`);
    }

    this.logger.log(`Order paid: ${order.id} (${tickets.length} tickets)`);
    return { ...order, tickets };
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
    order.cancel();
    return this.orderRepo.save(order);
  }

  async refundOrder(id: string, userId: string): Promise<Order> {
    const order = await this.findOne(id, userId);
    order.refund();
    return this.orderRepo.save(order);
  }

  private async cancelPending(order: Order) {
    if (this.inventory && order.holds) {
      await this.releaseHolds(order.holds, order.userId);
    }
    order.cancel();
    return this.orderRepo.save(order);
  }

  private async releaseHolds(holds: Order['holds'], userId: string) {
    if (!this.inventory || !holds) return;
    for (const hold of holds) {
      if (!this.inventory.isHoldActive(hold.holdId, userId)) continue;
      await this.inventory.releaseHold(hold.eventId, hold.holdId, userId).catch(() => undefined);
    }
  }
}

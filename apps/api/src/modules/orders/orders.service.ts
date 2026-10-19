import {
  BadRequestException,
  ConflictException,
  GoneException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
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

type Buyer = { sub: string; email: string };

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
    private readonly eventDao: EventDao,
    private readonly eventsService: EventsService,
    private readonly inventory: InventoryService,
    private readonly payments: PaymentsService,
    private readonly tickets: TicketsService,
  ) { }

  async create(buyer: Buyer, createOrderDto: CreateOrderDto): Promise<Order> {
    const userId = buyer.sub;

    // Agrupa líneas repetidas del mismo tipo de entrada y valida contra el evento.
    const lines = new Map<string, OrderItem>();
    for (const itemDto of createOrderDto.items) {
      const event = await this.eventDao.findOne(itemDto.eventId);
      if (event.status !== EventStatus.PUBLISHED) {
        throw new BadRequestException(`Event "${event.title}" is not on sale`);
      }
      const ticketType = event.ticketTypes.find(ticket => ticket.id === itemDto.ticketType || ticket.name === itemDto.ticketType);
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
    const items = [...lines.values()];

    // Un HOLD por evento: reserva el cupo mientras se paga.
    const perEvent = new Map<string, number>();
    for (const item of items) perEvent.set(item.eventId, (perEvent.get(item.eventId) ?? 0) + item.quantity);
    const holds: Order['holds'] = [];
    try {
      for (const [eventId, quantity] of perEvent) {
        const hold = await this.inventory.createHold(eventId, userId, quantity);
        holds.push({ eventId, holdId: hold.id, expiresAt: hold.expiresAt });
      }
    } catch (error) {
      await this.releaseHolds(holds, userId);
      throw error;
    }

    const order = new Order();
    order.userId = userId;
    order.items = items;
    order.holds = holds;
    order.total = items.reduce((sum, item) => sum + item.subtotal, 0);
    order.status = OrderStatus.PENDING;

    const savedOrder = await this.orderRepo.save(order);

    // Emit order.created event to RabbitMQ
    this.rabbitClient.emit('order.created', {
      orderId: savedOrder.id,
      userId,
      userEmail: buyer.email,
      total: Number(savedOrder.total),
      status: savedOrder.status,
      expiresAt: holds[0]?.expiresAt,
    });

    this.logger.log(`Order created: ${savedOrder.id} for user ${userId}`);
    return savedOrder;
  }

  async pay(orderId: string, buyer: Buyer, card: string) {
    const userId = buyer.sub;
    const order = await this.findOne(orderId, userId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.PENDING) {
      throw new ConflictException(`Order is already ${order.status}`);
    }

    // No cobrar si la reserva ya venció.
    if (order.holds.some(hold => !this.inventory.isHoldActive(hold.holdId, userId))) {
      await this.cancelPending(order);
      throw new GoneException('Reservation expired; the order was cancelled');
    }

    const approved = await this.payments.processPayment(Number(order.total), card);
    if (!approved) {
      await this.cancelPending(order);
      throw new HttpException({ statusCode: HttpStatus.PAYMENT_REQUIRED, message: 'Payment declined; the order was cancelled', orderId: order.id }, HttpStatus.PAYMENT_REQUIRED);
    }

    for (const hold of order.holds) {
      await this.inventory.commitHold(hold.eventId, hold.holdId, userId);
    }
    order.status = OrderStatus.PAID;
    await this.orderRepo.save(order);

    const tickets = [];
    for (const item of order.items) {
      await this.eventsService.registerSale(item.eventId, item.ticketTypeId ?? '', item.quantity);
      tickets.push(...await this.tickets.emit(order.id, item.eventId, userId, item.quantity, item.ticketType));
    }

    this.rabbitClient.emit('order.paid', {
      orderId: order.id,
      userId,
      userEmail: buyer.email,
      total: Number(order.total),
      ticketCodes: tickets.map(ticket => ticket.code),
    });
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
      relations: { items: { event: true } },
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string, userId: string): Promise<Order | null> {
    return this.orderRepo.findOne({
      where: { id, userId },
      relations: { items: { event: true } }
    });
  }

  private async cancelPending(order: Order) {
    await this.releaseHolds(order.holds, order.userId);
    order.status = OrderStatus.CANCELLED;
    return this.orderRepo.save(order);
  }

  private async releaseHolds(holds: Order['holds'], userId: string) {
    for (const hold of holds) {
      if (!this.inventory.isHoldActive(hold.holdId, userId)) continue;
      await this.inventory.releaseHold(hold.eventId, hold.holdId, userId).catch(() => undefined);
    }
  }
}

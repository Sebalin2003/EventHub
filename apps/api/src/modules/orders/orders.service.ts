import {
  ForbiddenException,
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

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @Inject('NOTIFICATIONS_SERVICE') private rabbitClient: ClientProxy,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto, idempotencyKey?: string): Promise<Order> {
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

    let total = 0;
    const items = createOrderDto.items.map(itemDto => {
      const subtotal = itemDto.quantity * itemDto.unitPrice;
      total += subtotal;

      const item = new OrderItem();
      item.eventId = itemDto.eventId;
      item.ticketType = itemDto.ticketType;
      item.quantity = itemDto.quantity;
      item.unitPrice = itemDto.unitPrice;
      item.subtotal = subtotal;
      return item;
    });

    const order = new Order();
    order.userId = userId;
    order.items = items;
    order.total = total;
    order.status = OrderStatus.PENDING;
    order.idempotencyKey = idempotencyKey;
    order.version = 1;

    const savedOrder = await this.orderRepo.save(order);

    // Emit order.created event to RabbitMQ
    try {
      this.rabbitClient.emit('order.created', {
        orderId: savedOrder.id,
        userId,
        total: savedOrder.total,
        status: savedOrder.status,
      });
    } catch (err) {
      this.logger.warn(`Failed to emit order.created to broker: ${err}`);
    }

    this.logger.log(`Order created: ${savedOrder.id} for user ${userId}`);
    return savedOrder;
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
}

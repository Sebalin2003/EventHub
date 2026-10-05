import { Inject, Injectable, Logger } from '@nestjs/common';
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
  ) { }

  async create(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
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

    const savedOrder = await this.orderRepo.save(order);

    // Emit order.created event to RabbitMQ
    this.rabbitClient.emit('order.created', {
      orderId: savedOrder.id,
      userId,
      total: savedOrder.total,
      status: savedOrder.status,
    });

    this.logger.log(`Order created: ${savedOrder.id} for user ${userId}`);
    return savedOrder;
  }

  async findAllByUser(userId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { userId },
      relations: ['items', 'items.event'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string, userId: string): Promise<Order | null> {
    return this.orderRepo.findOne({
      where: { id, userId },
      relations: ['items', 'items.event']
    });
  }
}

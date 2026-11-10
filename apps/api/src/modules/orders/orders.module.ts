import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OrdersService } from './orders.service.js';
import { OrdersController } from './orders.controller.js';
import { Order } from './entities/order.entity.js';
import { OrderItem } from './entities/order-item.entity.js';
import { IdentityModule } from '../identity/identity.module.js';
import { EventsModule } from '../events/events.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { TicketsModule } from '../tickets/tickets.module.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { OutboxModule } from '../../common/broker/outbox.module.js';
import {
  NOTIFICATIONS_DLQ,
  NOTIFICATIONS_DLX,
  NOTIFICATIONS_QUEUE,
  rabbitMqUrl,
} from '../../common/broker/broker.constants.js';

@Module({
  imports: [
    OutboxModule,
    IdentityModule,
    EventsModule,
    InventoryModule,
    PaymentsModule,
    TicketsModule,
    TypeOrmModule.forFeature([Order, OrderItem]),
    ClientsModule.register([
      {
        name: 'NOTIFICATIONS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [rabbitMqUrl()],
          queue: NOTIFICATIONS_QUEUE,
          persistent: true,
          queueOptions: {
            durable: true,
            deadLetterExchange: NOTIFICATIONS_DLX,
            deadLetterRoutingKey: NOTIFICATIONS_DLQ,
          },
        },
      },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, JwtAuthGuard],
  exports: [OrdersService],
})
export class OrdersModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { IdentityModule } from '../identity/identity.module.js';
import { User } from '../identity/entities/user.entity.js';
import { Event } from './entities/event.entity.js';
import { EventDao } from './event.dao.js';
import { EventFactory } from './event.factory.js';
import { EventsController } from './events.controller.js';
import { EventsService } from './events.service.js';
import { EventSeed } from './event.seed.js';
import { OrganizerEventsController } from './organizer-events.controller.js';
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
    TypeOrmModule.forFeature([Event, User]),
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
  controllers: [EventsController, OrganizerEventsController],
  providers: [EventsService, EventDao, EventFactory, EventSeed, JwtAuthGuard, RolesGuard],
  exports: [EventsService, EventDao],
})
export class EventsModule {}

import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  NOTIFICATIONS_DLQ,
  NOTIFICATIONS_DLX,
  NOTIFICATIONS_QUEUE,
  rabbitMqUrl,
} from './broker.constants.js';
import { BrokerTopologyService } from './broker-topology.service.js';
import { OutboxMessage } from './outbox-message.entity.js';
import { OutboxService } from './outbox.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([OutboxMessage]),
    ClientsModule.register([
      {
        name: 'OUTBOX_BROKER',
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
  providers: [OutboxService, BrokerTopologyService],
  exports: [OutboxService, BrokerTopologyService],
})
export class OutboxModule {}

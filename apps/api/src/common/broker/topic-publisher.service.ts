import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';
import { EVENTS_TOPIC_EXCHANGE, rabbitMqUrl } from './broker.constants.js';

/**
 * Publicador al Exchange Topic de RabbitMQ (Etapa 4 / P-14).
 * Publica cada evento de dominio con su routing key (ej: order.created, order.paid)
 * para que tanto notifications_queue como audit_queue lo reciban en paralelo.
 */
@Injectable()
export class TopicPublisherService implements OnModuleDestroy {
  private readonly logger = new Logger(TopicPublisherService.name);
  private connection?: any;
  private channel?: any;

  async publish(topic: string, payload: Record<string, unknown>, messageId?: string): Promise<void> {
    const channel = await this.ensureChannel();
    const envelope = Buffer.from(JSON.stringify({ pattern: topic, data: payload }));
    const ok = channel.publish(EVENTS_TOPIC_EXCHANGE, topic, envelope, {
      persistent: true,
      contentType: 'application/json',
      ...(messageId ? { messageId } : {}),
    });
    if (!ok) {
      this.logger.warn(`[TOPIC] Backpressure al publicar "${topic}" en ${EVENTS_TOPIC_EXCHANGE}`);
    }
  }

  private async ensureChannel() {
    if (this.channel) return this.channel;
    this.connection = await amqp.connect(rabbitMqUrl(), { timeout: 3000 });
    this.connection.on('close', () => {
      this.connection = undefined;
      this.channel = undefined;
    });
    this.connection.on('error', () => {
      this.connection = undefined;
      this.channel = undefined;
    });
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(EVENTS_TOPIC_EXCHANGE, 'topic', { durable: true });
    return this.channel;
  }

  async onModuleDestroy() {
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
    this.channel = undefined;
    this.connection = undefined;
  }
}

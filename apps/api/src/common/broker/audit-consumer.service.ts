import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import {
  AUDIT_QUEUE,
  EVENTS_TOPIC_EXCHANGE,
  EVENTS_TOPIC_PATTERN,
  rabbitMqUrl,
} from './broker.constants.js';

export type AuditRecord = {
  topic: string;
  payload: Record<string, unknown>;
  receivedAt: string;
};

/**
 * Segundo consumidor suscripto al Exchange Topic (cola audit_queue).
 * Garantiza que cada evento publicado llegue a al menos 2 consumidores independientes
 * (notificaciones y auditoría).
 */
@Injectable()
export class AuditConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuditConsumerService.name);
  private connection?: any;
  private channel?: any;
  private retryTimer?: NodeJS.Timeout;
  private readonly records: AuditRecord[] = [];

  async onModuleInit() {
    await this.connectAndConsume();
  }

  async onModuleDestroy() {
    if (this.retryTimer) clearInterval(this.retryTimer);
    this.retryTimer = undefined;
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
    this.channel = undefined;
    this.connection = undefined;
  }

  getRecords(): AuditRecord[] {
    return [...this.records];
  }

  handleRawMessage(raw: { pattern?: string; data?: Record<string, unknown> }, routingKey?: string): AuditRecord {
    const record: AuditRecord = {
      topic: raw.pattern ?? routingKey ?? 'unknown',
      payload: raw.data ?? (raw as Record<string, unknown>),
      receivedAt: new Date().toISOString(),
    };
    this.records.push(record);
    this.logger.log(`[AUDIT CONSUMER] Evento auditado: "${record.topic}"`);
    return record;
  }

  private async connectAndConsume() {
    try {
      this.connection = await amqp.connect(rabbitMqUrl(), { timeout: 5000 });
      this.connection.on('error', () => undefined);
      this.connection.on('close', () => {
        this.channel = undefined;
        this.scheduleRetry();
      });

      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(EVENTS_TOPIC_EXCHANGE, 'topic', { durable: true });
      await this.channel.assertQueue(AUDIT_QUEUE, { durable: true });
      await this.channel.bindQueue(AUDIT_QUEUE, EVENTS_TOPIC_EXCHANGE, EVENTS_TOPIC_PATTERN);

      await this.channel.consume(
        AUDIT_QUEUE,
        (msg: any) => {
          if (!msg) return;
          try {
            const parsed = JSON.parse(msg.content.toString('utf8'));
            this.handleRawMessage(parsed, msg.fields?.routingKey);
            this.channel.ack(msg);
          } catch (error) {
            this.logger.warn(`[AUDIT CONSUMER] Mensaje malformado descartado: ${(error as Error).message}`);
            this.channel.nack(msg, false, false);
          }
        },
        { noAck: false },
      );

      if (this.retryTimer) clearInterval(this.retryTimer);
      this.retryTimer = undefined;
      this.logger.log(`[AUDIT CONSUMER] Escuchando en cola "${AUDIT_QUEUE}"`);
    } catch (error) {
      this.logger.warn(`[AUDIT CONSUMER] RabbitMQ no disponible: ${(error as Error).message}`);
      this.scheduleRetry();
    }
  }

  private scheduleRetry() {
    if (this.retryTimer) return;
    this.retryTimer = setInterval(() => {
      if (!this.channel) void this.connectAndConsume();
    }, 5000);
    this.retryTimer.unref();
  }
}

import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { OutboxMessage, OutboxStatus } from './outbox-message.entity.js';

export type OutboxFlushResult = { sent: number; pending: number };

/**
 * Dispatcher del outbox (Eje C).
 *
 * Publica los eventos persistidos en el outbox y los marca como SENT.
 * Si RabbitMQ no responde, el mensaje queda PENDING y se reintenta en el
 * siguiente ciclo; no se pierde aunque el broker se reinicie.
 */
@Injectable()
export class OutboxService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxService.name);
  private timer?: NodeJS.Timeout;
  private flushing = false;

  private readonly publishTimeoutMs = Number(process.env.OUTBOX_PUBLISH_TIMEOUT_MS ?? 3000);
  private readonly pollIntervalMs = Number(process.env.OUTBOX_POLL_INTERVAL_MS ?? 2000);

  constructor(
    @InjectRepository(OutboxMessage)
    private readonly outboxRepository: Repository<OutboxMessage>,
    @Inject('OUTBOX_BROKER')
    private readonly client: ClientProxy,
  ) {}

  async enqueue(topic: string, payload: Record<string, unknown>): Promise<OutboxMessage> {
    return this.outboxRepository.save(
      this.outboxRepository.create({
        topic,
        payload,
        status: OutboxStatus.PENDING,
        attempts: 0,
        lastError: null,
        sentAt: null,
      }),
    );
  }

  async flush(): Promise<OutboxFlushResult> {
    if (this.flushing) return { sent: 0, pending: 0 };
    this.flushing = true;

    let sent = 0;
    let pending = 0;
    try {
      const messages = await this.outboxRepository.find({
        where: { status: OutboxStatus.PENDING },
        order: { createdAt: 'ASC' },
        take: 50,
      });

      for (const message of messages) {
        try {
          await firstValueFrom(
            this.client.emit(message.topic, message.payload).pipe(timeout(this.publishTimeoutMs)),
            { defaultValue: undefined },
          );
          message.status = OutboxStatus.SENT;
          message.sentAt = new Date();
          message.lastError = null;
          sent += 1;
        } catch (error) {
          message.attempts += 1;
          message.lastError = (error as Error)?.message ?? String(error);
          pending += 1;
          this.logger.warn(
            `[OUTBOX] No se pudo publicar "${message.topic}" (intento ${message.attempts}); queda PENDING: ${message.lastError}`,
          );
          await this.outboxRepository.save(message);
          // Si el broker no responde, se corta el ciclo para no esperar 3s por cada mensaje.
          break;
        }
        await this.outboxRepository.save(message);
      }
    } finally {
      this.flushing = false;
    }

    return { sent, pending };
  }

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.flush().catch(error => this.logger.error(`[OUTBOX] flush fallo: ${(error as Error).message}`));
    }, this.pollIntervalMs);
    this.timer.unref();
    void this.flush().catch(error => this.logger.error(`[OUTBOX] flush inicial fallo: ${(error as Error).message}`));
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }
}

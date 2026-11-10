import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import {
  NOTIFICATIONS_DLQ,
  NOTIFICATIONS_DLX,
  NOTIFICATIONS_QUEUE,
  rabbitMqUrl,
} from './broker.constants.js';

/**
 * Topologia real de RabbitMQ para el Eje C:
 * - cola principal durable con dead-letter-exchange
 * - exchange directo y cola de mensajes muertos durable
 *
 * Se asegura al arrancar y se reintenta si el broker no esta disponible.
 */
@Injectable()
export class BrokerTopologyService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BrokerTopologyService.name);
  private retryTimer?: NodeJS.Timeout;
  private ready = false;

  async onModuleInit() {
    await this.ensureTopology();
  }

  onModuleDestroy() {
    if (this.retryTimer) clearInterval(this.retryTimer);
    this.retryTimer = undefined;
  }

  isReady() {
    return this.ready;
  }

  private async ensureTopology() {
    const url = rabbitMqUrl();
    let connection: any;

    try {
      connection = await amqp.connect(url, { timeout: 5000 });
      let channel = await connection.createChannel();
      channel.on('error', () => undefined);

      await channel.assertExchange(NOTIFICATIONS_DLX, 'direct', { durable: true });
      await channel.assertQueue(NOTIFICATIONS_DLQ, { durable: true });
      await channel.bindQueue(NOTIFICATIONS_DLQ, NOTIFICATIONS_DLX, NOTIFICATIONS_DLQ);

      const queueOptions = {
        durable: true,
        deadLetterExchange: NOTIFICATIONS_DLX,
        deadLetterRoutingKey: NOTIFICATIONS_DLQ,
      };

      try {
        await channel.assertQueue(NOTIFICATIONS_QUEUE, queueOptions);
      } catch (error: any) {
        const isPreconditionFailure =
          error?.code === 406 ||
          error?.code === '406' ||
          /PRECONDITION_FAILED|406/.test(String(error?.message ?? ''));

        // En desarrollo la cola puede existir sin los argumentos de DLQ.
        // Se recrea para que el dead-lettering sea real (en produccion se migra).
        if (isPreconditionFailure && process.env.NODE_ENV !== 'production') {
          this.logger.warn(`[BROKER] Cola ${NOTIFICATIONS_QUEUE} incompatible; se recrea con DLQ en desarrollo.`);
          // El servidor cierra el canal al rechazar la declaracion: se abre uno nuevo.
          channel = await connection.createChannel();
          channel.on('error', () => undefined);
          await channel.deleteQueue(NOTIFICATIONS_QUEUE);
          await channel.assertQueue(NOTIFICATIONS_QUEUE, queueOptions);
        } else {
          throw error;
        }
      }

      await channel.close();
      await connection.close();
      this.ready = true;
      if (this.retryTimer) clearInterval(this.retryTimer);
      this.retryTimer = undefined;
      this.logger.log(
        `[BROKER] Topologia lista: ${NOTIFICATIONS_QUEUE} -> ${NOTIFICATIONS_DLX} -> ${NOTIFICATIONS_DLQ}`,
      );
    } catch (error) {
      this.ready = false;
      this.logger.warn(`[BROKER] No se pudo asegurar la topologia: ${(error as Error).message}`);
      if (connection) {
        await connection.close().catch(() => undefined);
      }
      this.scheduleRetry();
    }
  }

  private scheduleRetry() {
    if (this.retryTimer) return;
    this.retryTimer = setInterval(() => {
      if (!this.ready) void this.ensureTopology();
    }, 5000);
    this.retryTimer.unref();
  }
}

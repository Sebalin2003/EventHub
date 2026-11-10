import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service.js';

type ProcessingResult = {
  status: 'PROCESSED' | 'DUPLICATE_SKIPPED' | 'ROUTED_TO_DLQ';
  notificationId?: string;
};

@Controller()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern('event.created')
  async handleEventCreated(@Payload() data: any, @Ctx() context: any) {
    this.logger.log(`Received event.created: ${JSON.stringify(data)}`);
    return this.process(context, () =>
      this.notificationsService.processIncomingMessage(
        'event.created',
        data,
        data?.id || `event-${data?.eventId}`,
      ),
    );
  }

  @EventPattern('order.created')
  async handleOrderCreated(@Payload() data: any, @Ctx() context: any) {
    this.logger.log(`Received order.created: ${JSON.stringify(data)}`);
    return this.process(context, () =>
      this.notificationsService.processIncomingMessage(
        'order.created',
        data,
        data?.id || `order-${data?.orderId}`,
      ),
    );
  }

  @EventPattern('order.paid')
  async handleOrderPaid(@Payload() data: any, @Ctx() context: any) {
    this.logger.log(`Received order.paid: ${JSON.stringify(data)}`);
    return this.process(context, () =>
      this.notificationsService.sendEmail(
        data.userEmail || 'user@example.com',
        'Tus entradas están listas',
        'order-paid',
        data,
      ),
    );
  }

  /**
   * Ack/nack manual (noAck: false) para que los mensajes invalidos terminen
   * en la DLQ real de RabbitMQ y los validos se confirmen una sola vez.
   */
  private async process(context: any, handler: () => Promise<ProcessingResult>) {
    try {
      const result = await handler();
      this.settle(context, result);
      return result;
    } catch (error) {
      this.logger.error(`Fallo procesando mensaje; se envia a DLQ: ${(error as Error).message}`);
      this.settle(context, null, false);
      throw error;
    }
  }

  private settle(context: any, result: ProcessingResult | null, requeueOnFailure = true) {
    const channel = context.getChannelRef();
    const message = context.getMessage();

    try {
      if (!result) {
        channel.nack(message, false, false);
        return;
      }

      if (result.status === 'ROUTED_TO_DLQ') {
        // Reintentos 1..N-1 vuelven a la cola; el ultimo se rechaza sin requeue
        // y RabbitMQ lo enruta al DLX/DLQ configurado.
        channel.nack(message, false, !result.notificationId && requeueOnFailure);
        return;
      }

      channel.ack(message);
    } catch (error) {
      this.logger.warn(`No se pudo confirmar el mensaje: ${(error as Error).message}`);
    }
  }
}

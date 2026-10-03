import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service.js';

@Controller()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern('event.created')
  async handleEventCreated(@Payload() data: any, @Ctx() context: RmqContext) {
    this.logger.log(`Received event.created: ${JSON.stringify(data)}`);
    await this.notificationsService.sendEmail(
      data.organizerEmail || 'admin@eventhub.com',
      'Evento creado exitosamente',
      'event-created',
      data,
    );
  }

  @EventPattern('order.created')
  async handleOrderCreated(@Payload() data: any, @Ctx() context: RmqContext) {
    this.logger.log(`Received order.created: ${JSON.stringify(data)}`);
    await this.notificationsService.sendEmail(
      data.userEmail || 'user@example.com',
      'Confirmación de tu compra',
      'order-created',
      data,
    );
  }
}

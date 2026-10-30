import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service.js';

@Controller()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern('event.created')
  async handleEventCreated(@Payload() data: any) {
    this.logger.log(`Received event.created: ${JSON.stringify(data)}`);
    return this.notificationsService.processIncomingMessage(
      'event.created',
      data,
      data?.id || `event-${data?.eventId}`,
    );
  }

  @EventPattern('order.created')
  async handleOrderCreated(@Payload() data: any) {
    this.logger.log(`Received order.created: ${JSON.stringify(data)}`);
    return this.notificationsService.processIncomingMessage(
      'order.created',
      data,
      data?.id || `order-${data?.orderId}`,
    );
  }
}

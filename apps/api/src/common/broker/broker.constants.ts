export const NOTIFICATIONS_QUEUE = 'notifications_queue';
export const NOTIFICATIONS_DLQ = 'notifications_dlq';
export const NOTIFICATIONS_DLX = 'eventhub.dlx';

export const DEFAULT_RABBITMQ_URL = 'amqp://user:password@localhost:5672';

export function rabbitMqUrl(): string {
  return process.env.RABBITMQ_URL || DEFAULT_RABBITMQ_URL;
}

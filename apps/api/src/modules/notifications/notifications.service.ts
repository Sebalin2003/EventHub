import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity.js';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  // Idempotency cache: tracks processed message identifiers (Eje C: Consumidor idempotente)
  private readonly processedMessageKeys = new Set<string>();

  // Failed message retry counts before sending to DLQ (Eje C: DLQ y reproceso)
  private readonly messageRetries = new Map<string, number>();
  private readonly maxRetries = 3;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async processIncomingMessage(
    messageType: string,
    payload: any,
    messageId?: string,
  ): Promise<{ status: 'PROCESSED' | 'DUPLICATE_SKIPPED' | 'ROUTED_TO_DLQ'; notificationId?: string }> {
    // Generate deterministic idempotency key
    const deduplicationKey = messageId || `${messageType}:${payload?.orderId || payload?.eventId || JSON.stringify(payload)}`;

    // 1. Idempotency Check: if message already processed, acknowledge and discard duplicate
    if (this.processedMessageKeys.has(deduplicationKey)) {
      this.logger.warn(`[IDEMPOTENT CONSUMER] Mensaje duplicado detectado y descartado: "${deduplicationKey}". Se evita reprocesamiento.`);
      return { status: 'DUPLICATE_SKIPPED' };
    }

    // 2. Validation & Poison Pill Detection
    const recipient = payload?.organizerEmail || payload?.userEmail || payload?.to;
    if (!recipient || typeof recipient !== 'string' || !recipient.includes('@')) {
      const currentRetries = (this.messageRetries.get(deduplicationKey) || 0) + 1;
      this.messageRetries.set(deduplicationKey, currentRetries);

      if (currentRetries >= this.maxRetries) {
        this.logger.error(`[DEAD LETTER QUEUE - DLQ] Mensaje inválido falló ${currentRetries} veces. Enrutado a "notifications_dlq" para auditoría y reproceso.`);
        const dlqRecord = this.notificationRepository.create({
          to: 'dlq@eventhub.com',
          subject: `[DLQ] Falla en ${messageType}`,
          template: 'dlq-poison-pill',
          payload: { originalPayload: payload, error: 'Destinatario inválido', retries: currentRetries },
        });
        await this.notificationRepository.save(dlqRecord);
        return { status: 'ROUTED_TO_DLQ', notificationId: dlqRecord.id };
      }

      this.logger.warn(`[RETRY ${currentRetries}/${this.maxRetries}] Mensaje inválido en cola, reintentando.`);
      return { status: 'ROUTED_TO_DLQ' };
    }

    // 3. Process valid message
    const subject = messageType === 'order.created'
      ? 'Confirmación de tu compra en EventHub'
      : 'Nuevo evento publicado en EventHub';

    const template = messageType === 'order.created' ? 'order-confirmation' : 'event-notification';

    const notification = this.notificationRepository.create({
      to: recipient,
      subject,
      template,
      payload,
    });

    const saved = await this.notificationRepository.save(notification);
    this.processedMessageKeys.add(deduplicationKey);

    this.logger.log(`[EMAIL SENT] To: ${recipient} | Subject: ${subject} | Record ID: ${saved.id}`);
    return { status: 'PROCESSED', notificationId: saved.id };
  }

  async sendEmail(to: string, subject: string, template: string, payload: any) {
    return this.processIncomingMessage(template, { to, ...payload });
  }

  getProcessedCount(): number {
    return this.processedMessageKeys.size;
  }
}

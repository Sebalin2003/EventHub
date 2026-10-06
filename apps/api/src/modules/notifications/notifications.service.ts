import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity.js';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>
  ) {}

  async sendEmail(to: string, subject: string, template: string, payload: any) {
    this.logger.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
    this.logger.debug(`Template: ${template} | Payload: ${JSON.stringify(payload)}`);

    const notification = this.notificationRepository.create({
      to,
      subject,
      template,
      payload,
    });
    
    await this.notificationRepository.save(notification);
    this.logger.log(`Notification persisted with ID: ${notification.id}`);
  }
}

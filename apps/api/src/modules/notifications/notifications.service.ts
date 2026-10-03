import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async sendEmail(to: string, subject: string, template: string, payload: any) {
    this.logger.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
    this.logger.debug(`Template: ${template} | Payload: ${JSON.stringify(payload)}`);
  }
}

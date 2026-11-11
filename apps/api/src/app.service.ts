import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { service: string; status: string } {
    // Eje D: la raiz de una API debe responder JSON, no text/html.
    return { service: 'EventHub API', status: 'ok' };
  }
}

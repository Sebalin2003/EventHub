import { Injectable } from '@nestjs/common';

interface PaymentGateway {
  process(amount: number, card: string): Promise<boolean>;
}

class LegacySoapGateway {
  async sendSoapRequest(xml: string): Promise<string> {
    return `<response><status>OK</status></response>`;
  }
}

class SoapAdapter implements PaymentGateway {
  constructor(private readonly legacy: LegacySoapGateway) {}
  async process(amount: number, card: string): Promise<boolean> {
    const xml = `<request><amount>${amount}</amount><card>${card}</card></request>`;
    const res = await this.legacy.sendSoapRequest(xml);
    return res.includes('OK');
  }
}

@Injectable()
export class PaymentsService {
  private gateway = new SoapAdapter(new LegacySoapGateway());
  async processPayment(amount: number, card: string) {
    return this.gateway.process(amount, card);
  }
}

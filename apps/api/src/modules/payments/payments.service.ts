import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as soap from 'soap';

interface PaymentGateway {
  process(amount: number, card: string): Promise<boolean>;
}

// Validación de Luhn: el mock rechaza tarjetas inválidas para poder demostrar pagos rechazados.
function isValidCard(card: string) {
  const digits = card.replace(/\D/g, '');
  if (digits.length < 12 || digits.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let digit = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

@Injectable()
export class SoapClientService implements OnModuleInit {
  private readonly logger = new Logger(SoapClientService.name);
  private client: soap.Client;
  private readonly wsdlUrl = process.env.PAYMENTS_WSDL_URL || 'https://www.dataaccess.com/webservicesserver/NumberConversion.wso?WSDL'; // Using a public WSDL as placeholder

  async onModuleInit() {
    try {
      this.client = await soap.createClientAsync(this.wsdlUrl);
      this.logger.log('SOAP Client initialized successfully');
    } catch (error) {
      this.logger.warn(`SOAP WSDL unavailable (${(error as Error).message.split('\n')[0]}). Using mock gateway.`);
    }
  }

  async sendSoapPayment(amount: number, card: string): Promise<{ status: 'OK' | 'ERROR' }> {
    if (!this.client) {
      this.logger.warn('SOAP Client is not initialized. Returning mock response.');
    }

    try {
      // Placeholder for an actual SOAP call since we're using a public mock WSDL
      // const [result] = await this.client.ProcessPaymentAsync({ amount, card });
      // return result;
      return { status: amount > 0 && isValidCard(card) ? 'OK' : 'ERROR' };
    } catch (error) {
      this.logger.error('Error during SOAP call', error);
      return { status: 'ERROR' };
    }
  }
}

class SoapAdapter implements PaymentGateway {
  constructor(private readonly soapClient: SoapClientService) {}

  async process(amount: number, card: string): Promise<boolean> {
    const res = await this.soapClient.sendSoapPayment(amount, card);
    return res && res.status === 'OK';
  }
}

@Injectable()
export class PaymentsService {
  private gateway: SoapAdapter;

  constructor(private readonly soapClientService: SoapClientService) {
    this.gateway = new SoapAdapter(this.soapClientService);
  }

  async processPayment(amount: number, card: string) {
    return this.gateway.process(amount, card);
  }
}

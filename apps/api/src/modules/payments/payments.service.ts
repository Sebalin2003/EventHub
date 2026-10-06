import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as soap from 'soap';

interface PaymentGateway {
  process(amount: number, card: string): Promise<boolean>;
}

@Injectable()
export class SoapClientService implements OnModuleInit {
  private readonly logger = new Logger(SoapClientService.name);
  private client: soap.Client;
  private readonly wsdlUrl = 'https://www.dataaccess.com/webservicesserver/NumberConversion.wso?WSDL'; // Using a public WSDL as placeholder

  async onModuleInit() {
    try {
      this.client = await soap.createClientAsync(this.wsdlUrl);
      this.logger.log('SOAP Client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize SOAP Client', error);
    }
  }

  async sendSoapPayment(amount: number, card: string): Promise<any> {
    if (!this.client) {
      this.logger.warn('SOAP Client is not initialized. Returning mock response.');
      return { status: 'OK' };
    }
    
    try {
      // Placeholder for an actual SOAP call since we're using a public mock WSDL
      // const [result] = await this.client.ProcessPaymentAsync({ amount, card });
      // return result;
      return { status: 'OK' };
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

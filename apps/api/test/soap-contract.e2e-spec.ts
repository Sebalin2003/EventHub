import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import * as soap from 'soap';
import {
  PaymentsService,
  SoapClientService,
  sanitizeSoapMessage,
} from '../src/modules/payments/payments.service.js';

const wsdlPath = fileURLToPath(new URL('../../../docs/contracts/payments.wsdl', import.meta.url));
const wsdlXml = readFileSync(wsdlPath, 'utf8');
const PORT = 4100;
const WSDL_URL = `http://localhost:${PORT}/payments?wsdl`;

/**
 * Eje C - Integracion SOAP real.
 *
 * Se levanta un servidor SOAP local que responde:
 * - pago valido
 * - Fault de negocio (codigo Sender/Client)
 * - Fault tecnico (codigo Server)
 * - demora mayor al timeout de 5s
 *
 * El cliente debe mapear cada caso sin filtrar XML crudo al usuario.
 */
describe('Eje C - SOAP real: valido, Fault de negocio, Fault tecnico y timeout', () => {
  let server: any;
  let httpServer: ReturnType<typeof createServer>;
  let previousWsdl: string | undefined;

  beforeAll(async () => {
    httpServer = createServer();
    await new Promise<void>(resolve => httpServer.listen(PORT, '127.0.0.1', resolve));
    server = soap.listen(
      httpServer,
      '/payments',
      {
        PaymentGatewayService: {
          PaymentGatewayPort: {
            ProcessPayment: async (args: { amount: number; cardNumber: string }) => {
              const card = String(args.cardNumber);

              if (card.endsWith('4001')) {
                throw {
                  Fault: {
                    faultcode: 'soap:Client',
                    faultstring: 'Client.InsufficientFunds: fondos insuficientes',
                  },
                };
              }

              if (card.endsWith('5001')) {
                throw {
                  Fault: {
                    faultcode: 'soap:Server',
                    faultstring: 'Server.InternalBankingError: core no disponible',
                  },
                };
              }

              if (card.endsWith('7001')) {
                throw {
                  Fault: {
                    faultcode: 'soap:Server',
                    faultstring: 'Server.GatewayUnavailable: pasarela no disponible',
                  },
                };
              }

              if (card.endsWith('9999')) {
                await new Promise(resolve => setTimeout(resolve, 6000));
              }

              return {
                approved: Number(args.amount) > 0,
                transactionId: `WSDL-TX-${Date.now()}`,
                authCode: 'AUTH-WSDL',
                code: 'APPROVED',
              };
            },
          },
        },
      },
      wsdlXml,
    );
    previousWsdl = process.env.PAYMENTS_WSDL_URL;
    process.env.PAYMENTS_WSDL_URL = WSDL_URL;
  });

  afterAll(async () => {
    if (previousWsdl === undefined) {
      delete process.env.PAYMENTS_WSDL_URL;
    } else {
      process.env.PAYMENTS_WSDL_URL = previousWsdl;
    }
    await new Promise<void>(resolve => httpServer?.close(() => resolve()));
    void server;
  });

  async function realClient(): Promise<SoapClientService> {
    const service = new SoapClientService();
    await service.onModuleInit();
    expect(service.isAvailable()).toBe(true);
    return service;
  }

  it('publica el servicio PaymentGatewayService con la operacion ProcessPayment', async () => {
    const client: any = await soap.createClientAsync(wsdlPath);

    expect(typeof client.ProcessPaymentAsync).toBe('function');
    expect(client.describe().PaymentGatewayService.PaymentGatewayPort.ProcessPayment).toBeDefined();
    expect(client.wsdl.definitions.$targetNamespace).toBe('urn:eventhub:payments');
  });

  it('negocia un pago valido contra el servidor SOAP real usando el WSDL', async () => {
    const service = await realClient();

    const result = await service.requestPayment({
      orderId: 'soap-ok',
      amount: 15000,
      cardNumber: '4111 1111 1111 1111',
    });

    expect(result.status).toBe('OK');
    expect(result.faultType).toBe('NONE');
    expect(result.transactionId).toContain('WSDL-TX-');
    expect(result.authCode).toBe('AUTH-WSDL');
  });

  it('mapea un Fault de negocio sin filtrar XML crudo', async () => {
    const service = await realClient();

    const result = await service.requestPayment({
      orderId: 'soap-business',
      amount: 15000,
      cardNumber: '4111 1111 0340 01',
    });

    expect(result.status).toBe('ERROR');
    expect(result.faultType).toBe('BUSINESS_FAULT');
    expect(result.code).toBe('SOAP_BUSINESS_FAULT');
    expect(result.reason).toContain('InsufficientFunds');
    expect(result.reason).not.toContain('<');
  });

  it('mapea un Fault tecnico sin filtrar XML crudo', async () => {
    const service = await realClient();

    const result = await service.requestPayment({
      orderId: 'soap-technical',
      amount: 15000,
      cardNumber: '4111 1111 0050 01',
    });

    expect(result.status).toBe('ERROR');
    expect(result.faultType).toBe('TECHNICAL_FAULT');
    expect(result.code).toBe('SOAP_FAULT_TECHNICAL');
    expect(result.reason).not.toContain('<');
  });

  it('corta a los 5s cuando el servidor SOAP no responde', async () => {
    const service = await realClient();
    const started = Date.now();

    const result = await service.requestPayment({
      orderId: 'soap-timeout',
      amount: 15000,
      cardNumber: '4111 1111 0699 99',
    });

    const elapsed = Date.now() - started;
    expect(result.status).toBe('ERROR');
    expect(result.faultType).toBe('TIMEOUT');
    expect(result.code).toBe('GATEWAY_TIMEOUT');
    expect(elapsed).toBeGreaterThanOrEqual(4900);
    expect(elapsed).toBeLessThan(5600);
  }, 15000);

  it('PaymentsService usa la pasarela real y mapea el Fault tecnico', async () => {
    const soapClient = await realClient();
    const payments = new PaymentsService(soapClient);

    const result = await payments.processPayment({
      orderId: 'order-soap-technical',
      amount: 15000,
      cardNumber: '4111 1111 0670 01',
    });

    expect(result.success).toBe(false);
    expect(result.faultType).toBe('TECHNICAL_FAULT');
    expect(result.fallback).toBe(true);
  });

  it('PaymentsService devuelve el transactionId que entrega el servidor SOAP real', async () => {
    const soapClient = await realClient();
    const payments = new PaymentsService(soapClient);

    const result = await payments.processPayment({
      orderId: 'order-soap-approved',
      amount: 15000,
      cardNumber: '4111 1111 1111 1111',
    });

    expect(result.success).toBe(true);
    expect(result.transactionId).toContain('WSDL-TX-');
    expect(result.authCode).toBe('AUTH-WSDL');
    expect(result.faultType).toBe('NONE');
  });

  it('conserva el fallback local cuando la tarjeta no pasa Luhn', async () => {
    const service = new SoapClientService();

    const result = await service.requestPayment({
      orderId: 'soap-invalid',
      amount: 15000,
      cardNumber: '1234',
    });

    expect(result.status).toBe('ERROR');
    expect(result.faultType).toBe('BUSINESS_FAULT');
    expect(result.code).toBe('INVALID_CARD');
    await expect(service.sendSoapPayment(15000, '1234')).resolves.toEqual({ status: 'ERROR' });
  });

  it('elimina etiquetas XML de los mensajes expuestos', () => {
    const sanitized = sanitizeSoapMessage('<soap:Fault><faultstring>Error</faultstring></soap:Fault>');
    expect(sanitized).not.toContain('<');
    expect(sanitized).toContain('Error');
  });
});

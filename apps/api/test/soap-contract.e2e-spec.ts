import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import * as soap from 'soap';
import { SoapClientService } from '../src/modules/payments/payments.service.js';

const wsdlPath = fileURLToPath(new URL('../../../docs/contracts/payments.wsdl', import.meta.url));
const wsdlXml = readFileSync(wsdlPath, 'utf8');
const PORT = 4100;
const WSDL_URL = `http://localhost:${PORT}/payments?wsdl`;

describe('Eje B - Contrato SOAP publicado (WSDL)', () => {
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
            ProcessPayment: async (args: { amount: number; cardNumber: string }) => ({
              approved: Number(args.amount) > 0 && !String(args.cardNumber).endsWith('4001'),
              transactionId: `WSDL-TX-${Date.now()}`,
              authCode: 'AUTH-WSDL',
              code: Number(args.amount) > 0 ? 'APPROVED' : 'REJECTED',
            }),
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

  it('publica el servicio PaymentGatewayService con la operacion ProcessPayment', async () => {
    const client: any = await soap.createClientAsync(wsdlPath);

    expect(typeof client.ProcessPaymentAsync).toBe('function');
    expect(client.describe().PaymentGatewayService.PaymentGatewayPort.ProcessPayment).toBeDefined();
    expect(client.wsdl.definitions.$targetNamespace).toBe('urn:eventhub:payments');
  });

  it('negocia el pago contra un servidor SOAP real usando el WSDL', async () => {
    const service = new SoapClientService();
    await service.onModuleInit();

    await expect(service.sendSoapPayment(15000, '4111 1111 1111 1111')).resolves.toEqual({ status: 'OK' });
  });

  it('reporta ERROR cuando el WSDL responde rechazo de negocio', async () => {
    const service = new SoapClientService();
    await service.onModuleInit();

    await expect(service.sendSoapPayment(15000, '4111 1111 1111 4001')).resolves.toEqual({ status: 'ERROR' });
  });

  it('conserva el fallback local cuando la tarjeta no pasa Luhn', async () => {
    const service = new SoapClientService();

    await expect(service.sendSoapPayment(15000, '1234')).resolves.toEqual({ status: 'ERROR' });
  });
});

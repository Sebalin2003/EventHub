import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as soap from 'soap';
import {
  CircuitBreakerState,
  isValidCard,
  PaymentsService,
  SoapClientService,
} from './payments.service.js';

vi.mock('soap', () => ({
  createClientAsync: vi.fn(),
}));

describe('PaymentsService - cobertura de resiliencia y validación (Eje B)', () => {
  let service: PaymentsService;

  beforeEach(() => {
    vi.mocked(soap.createClientAsync).mockReset();
    service = new PaymentsService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isValidCard (Luhn)', () => {
    it('acepta una tarjeta válida con y sin espacios', () => {
      expect(isValidCard('4111 1111 1111 1111')).toBe(true);
      expect(isValidCard('4111111111111111')).toBe(true);
    });

    it('rechaza tarjetas cortas, largas o con dígito verificador inválido', () => {
      expect(isValidCard('123')).toBe(false);
      expect(isValidCard('41111111111111111111')).toBe(false);
      expect(isValidCard('4111111111111112')).toBe(false);
    });
  });

  describe('SoapClientService', () => {
    it('inicializa el cliente WSDL correctamente', async () => {
      vi.mocked(soap.createClientAsync).mockResolvedValue({} as any);
      const client = new SoapClientService();

      await client.onModuleInit();

      expect(soap.createClientAsync).toHaveBeenCalled();
      await expect(client.sendSoapPayment(100, '4111 1111 1111 1111')).resolves.toEqual({ status: 'OK' });
    });

    it('tolera un WSDL caído y responde con el mock local', async () => {
      vi.mocked(soap.createClientAsync).mockRejectedValue(new Error('ECONNREFUSED\nstack'));
      const client = new SoapClientService();

      await client.onModuleInit();

      await expect(client.sendSoapPayment(100, '4500 0000 0000 4001')).resolves.toEqual({ status: 'ERROR' });
    });

    it('rechaza montos no positivos o tarjetas inválidas', async () => {
      const client = new SoapClientService();

      await expect(client.sendSoapPayment(0, '4500 0000 0000 0000')).resolves.toEqual({ status: 'ERROR' });
      await expect(client.sendSoapPayment(10, '1234')).resolves.toEqual({ status: 'ERROR' });
    });
  });

  describe('processPayment - sobrecarga numérica', () => {
    it('devuelve true para un pago aprobado', async () => {
      await expect(service.processPayment(1000, '4500 0000 0000 0000')).resolves.toBe(true);
    });

    it('devuelve false para un pago rechazado', async () => {
      await expect(service.processPayment(1000, '4500 0000 0000 4001')).resolves.toBe(false);
    });

    it('procesa el pago sin tarjeta usando el mock local', async () => {
      await expect(service.processPayment(1000, '')).resolves.toBe(true);
    });
  });

  describe('Circuit Breaker', () => {
    it('pasa a HALF_OPEN después del cooldown y vuelve a CLOSED con un éxito', async () => {
      let clock = 1_000_000;
      vi.spyOn(Date, 'now').mockImplementation(() => clock);

      for (let i = 0; i < 3; i++) {
        await service.processPayment({ orderId: `f-${i}`, amount: 10, cardNumber: '4500 0000 0000 5001' });
      }
      expect(service.getCircuitState()).toBe(CircuitBreakerState.OPEN);

      clock += 30_001;
      expect(service.getCircuitState()).toBe(CircuitBreakerState.HALF_OPEN);

      const result = await service.processPayment({ orderId: 'ok', amount: 10, cardNumber: '4500 0000 0000 0000' });
      expect(result.success).toBe(true);
      expect(service.getCircuitState()).toBe(CircuitBreakerState.CLOSED);
    });

    it('no abre el circuito con fallas de negocio (solo técnicas)', async () => {
      for (let i = 0; i < 5; i++) {
        await service.processPayment({ orderId: `b-${i}`, amount: 10, cardNumber: '4500 0000 0000 4001' });
      }
      expect(service.getCircuitState()).toBe(CircuitBreakerState.CLOSED);
    });

    it('mapea una excepción técnica inesperada a SOAP_FAULT_TECHNICAL', async () => {
      (service as any).executeSoapCall = vi.fn(async () => {
        throw new Error('boom');
      });

      const result: any = await service.processPayment({ orderId: 'x', amount: 10, cardNumber: '4500' });

      expect(result.success).toBe(false);
      expect(result.code).toBe('SOAP_FAULT_TECHNICAL');
      expect(result.fallback).toBe(true);
      expect(result.faultType).toBe('TECHNICAL_FAULT');
    });

    it('mapea el timeout del gateway a GATEWAY_TIMEOUT sin hilos colgados', async () => {
      (service as any).executeSoapCall = vi.fn(async () => {
        throw new Error('SOAP_GATEWAY_TIMEOUT');
      });

      const result: any = await service.processPayment({ orderId: 'x', amount: 10, cardNumber: '4500' });

      expect(result.success).toBe(false);
      expect(result.code).toBe('GATEWAY_TIMEOUT');
      expect(result.faultType).toBe('TIMEOUT');
    });
  });
});

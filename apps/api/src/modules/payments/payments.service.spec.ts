import { describe, it, expect, beforeEach } from 'vitest';
import { PaymentsService, CircuitBreakerState } from './payments.service.js';

describe('PaymentsService (Eje C: SOAP, Resiliencia, Circuit Breaker y Timeout)', () => {
  let service: PaymentsService;

  beforeEach(() => {
    service = new PaymentsService();
  });

  describe('Flujo Exitoso', () => {
    it('debe procesar exitosamente un pago válido vía SOAP y retornar código de autorización', async () => {
      const result = await service.processPayment({
        orderId: 'order-1',
        amount: 15000,
        cardNumber: '4500 1234 5678 0000',
        cardHolder: 'Carlos Asistente',
      });

      expect(result.success).toBe(true);
      expect(result.code).toBe('APPROVED');
      expect(result.transactionId).toContain('SOAP-TX-');
      expect(result.authCode).toBeDefined();
      expect(result.faultType).toBe('NONE');
    });
  });

  describe('Mapeo de SOAP Faults (Sin filtrar XML crudo al usuario)', () => {
    it('debe mapear Business Fault de fondos insuficientes a JSON limpio', async () => {
      const result = await service.processPayment({
        orderId: 'order-2',
        amount: 50000,
        cardNumber: '4500 0000 0000 4001',
        cardHolder: 'Usuario Sin Fondos',
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe('INSUFFICIENT_FUNDS');
      expect(result.reason).toContain('Fondos insuficientes');
      expect(result.faultType).toBe('BUSINESS_FAULT');
    });

    it('debe mapear Business Fault de tarjeta vencida a JSON limpio', async () => {
      const result = await service.processPayment({
        orderId: 'order-3',
        amount: 10000,
        cardNumber: '4500 0000 0000 4002',
        cardHolder: 'Usuario Tarjeta Vencida',
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe('CARD_EXPIRED');
      expect(result.reason).toContain('tarjeta provista se encuentra vencida');
    });

    it('debe mapear Technical Fault bancario aplicando fallback de contingencia', async () => {
      const result = await service.processPayment({
        orderId: 'order-4',
        amount: 10000,
        cardNumber: '4500 0000 0000 5001',
        cardHolder: 'Usuario Falla Banco',
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe('BANKING_SYSTEM_ERROR');
      expect(result.fallback).toBe(true);
      expect(result.faultType).toBe('TECHNICAL_FAULT');
    });
  });

  describe('Timeout Efectivo de 5s y Circuit Breaker', () => {
    it('debe abortar la llamada que supere 5s sin dejar hilos colgados', async () => {
      const start = Date.now();
      const result = await service.processPayment({
        orderId: 'order-timeout',
        amount: 10000,
        cardNumber: '4500 0000 0000 9999', // Simula demora de 6s
      });
      const duration = Date.now() - start;

      expect(duration).toBeGreaterThanOrEqual(4900);
      expect(result.success).toBe(false);
      expect(result.code).toBe('GATEWAY_TIMEOUT');
      expect(result.fallback).toBe(true);
      expect(result.faultType).toBe('TIMEOUT');
    }, 10000);

    it('debe abrir el Circuit Breaker tras 3 fallas técnicas consecutivas y hacer fast-fail', async () => {
      expect(service.getCircuitState()).toBe(CircuitBreakerState.CLOSED);

      // Falla 1
      await service.processPayment({ orderId: 'f1', amount: 100, cardNumber: '4500 0000 0000 5001' });
      // Falla 2
      await service.processPayment({ orderId: 'f2', amount: 100, cardNumber: '4500 0000 0000 5001' });
      // Falla 3 -> abre el circuito
      await service.processPayment({ orderId: 'f3', amount: 100, cardNumber: '4500 0000 0000 5001' });

      expect(service.getCircuitState()).toBe(CircuitBreakerState.OPEN);

      // 4ta llamada: debe responder instantáneamente sin llamar a la pasarela (fast-fail)
      const fastFailResult = await service.processPayment({
        orderId: 'f4',
        amount: 100,
        cardNumber: '4500 0000 0000 0000', // Tarjeta válida
      });

      expect(fastFailResult.success).toBe(false);
      expect(fastFailResult.code).toBe('CIRCUIT_BREAKER_OPEN');
      expect(fastFailResult.fallback).toBe(true);
    });
  });

  describe('Eje D Seguridad: Protección contra XXE en canal SOAP', () => {
    it('debe rechazar cargas útiles con entidades externas o DOCTYPE XML', async () => {
      const result = await service.processPayment({
        orderId: 'order-xxe',
        amount: 10000,
        cardNumber: '4500 0000 0000 0000',
        cardHolder: '<!DOCTYPE test [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]>',
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe('XXE_INJECTION_REJECTED');
      expect(result.reason).toContain('XXE');
    });
  });
});

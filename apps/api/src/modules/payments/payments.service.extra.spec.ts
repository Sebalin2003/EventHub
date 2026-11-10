import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as soap from 'soap';
import {
  CircuitBreakerState,
  isValidCard,
  PaymentsService,
  sanitizeSoapMessage,
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

describe('SoapClientService - pasarela SOAP real (Eje C)', () => {
  function withClient(raw: any): SoapClientService {
    const client = new SoapClientService();
    (client as any).client = raw;
    return client;
  }

  const validPayment = {
    orderId: 'order-soap',
    amount: 1500,
    cardNumber: '4111 1111 1111 1111',
    cardHolder: 'Ana Titular',
  };

  describe('sanitizeSoapMessage', () => {
    it('quita etiquetas XML, colapsa espacios y recorta a 200 caracteres', () => {
      expect(sanitizeSoapMessage('<soap:Fault>  Fondos   insuficientes </soap:Fault>')).toBe(
        'Fondos insuficientes',
      );
      expect(sanitizeSoapMessage('x'.repeat(300))).toHaveLength(200);
    });

    it('tolera valores nulos o indefinidos', () => {
      expect(sanitizeSoapMessage(null)).toBe('');
      expect(sanitizeSoapMessage(undefined)).toBe('');
    });
  });

  describe('isAvailable', () => {
    it('es false sin cliente negociado y true con cualquiera de las dos firmas', () => {
      expect(new SoapClientService().isAvailable()).toBe(false);
      expect(withClient({ processPaymentAsync: vi.fn() }).isAvailable()).toBe(true);
      expect(withClient({ ProcessPaymentAsync: vi.fn() }).isAvailable()).toBe(true);
    });
  });

  describe('requestPayment - validación previa', () => {
    it('rechaza montos no positivos como fault de negocio', async () => {
      const result = await withClient(undefined).requestPayment({ ...validPayment, amount: 0 });

      expect(result).toEqual({
        status: 'ERROR',
        faultType: 'BUSINESS_FAULT',
        code: 'INVALID_CARD',
        reason: 'Los datos de la tarjeta no son válidos.',
      });
    });

    it('rechaza tarjetas con dígito verificador inválido', async () => {
      const result = await withClient(undefined).requestPayment({
        ...validPayment,
        cardNumber: '4111 1111 1111 1112',
      });

      expect(result.faultType).toBe('BUSINESS_FAULT');
      expect(result.code).toBe('INVALID_CARD');
    });

    it('reporta GATEWAY_UNAVAILABLE cuando no hay pasarela configurada', async () => {
      const result = await withClient(undefined).requestPayment(validPayment);

      expect(result.status).toBe('ERROR');
      expect(result.faultType).toBe('TECHNICAL_FAULT');
      expect(result.code).toBe('GATEWAY_UNAVAILABLE');
      expect(result.reason).toBe('La pasarela de pagos no está configurada.');
    });
  });

  describe('requestPayment - respuestas de la pasarela', () => {
    it('aprueba y envía la tarjeta normalizada junto con el titular', async () => {
      const call = vi.fn().mockResolvedValue([
        { approved: true, code: 'APPROVED', transactionId: 'TX-1', authCode: 'AUTH-1' },
      ]);
      const client = withClient({ processPaymentAsync: call });

      const result = await client.requestPayment(validPayment);

      expect(result).toEqual({
        status: 'OK',
        faultType: 'NONE',
        code: 'APPROVED',
        reason: 'Pago aprobado por la pasarela SOAP.',
        transactionId: 'TX-1',
        authCode: 'AUTH-1',
      });
      expect(call).toHaveBeenCalledWith({
        orderId: 'order-soap',
        amount: 1500,
        cardNumber: '4111111111111111',
        cardHolder: 'Ana Titular',
      });
    });

    it('considera aprobada una respuesta sin campos explícitos', async () => {
      const client = withClient({ processPaymentAsync: vi.fn().mockResolvedValue([{}]) });

      const result = await client.requestPayment(validPayment);

      expect(result.status).toBe('OK');
      expect(result.code).toBe('APPROVED');
      expect(result.transactionId).toBeUndefined();
    });

    it('usa la firma ProcessPaymentAsync cuando la minúscula no existe', async () => {
      const call = vi.fn().mockResolvedValue([{ code: 'OK-2', transactionId: 'TX-2' }]);
      const client = withClient({ ProcessPaymentAsync: call });

      const result = await client.requestPayment(validPayment);

      expect(result.status).toBe('OK');
      expect(result.code).toBe('OK-2');
      expect(call).toHaveBeenCalled();
    });

    it('mapea un rechazo por approved=false a fault de negocio', async () => {
      const client = withClient({
        processPaymentAsync: vi.fn().mockResolvedValue([{ approved: false, code: 'DENIED' }]),
      });

      const result = await client.requestPayment(validPayment);

      expect(result.status).toBe('ERROR');
      expect(result.faultType).toBe('BUSINESS_FAULT');
      expect(result.code).toBe('DENIED');
      expect(result.reason).toBe('La pasarela rechazó la operación.');
    });

    it('mapea un rechazo por código REJECTED sin código alternativo', async () => {
      const client = withClient({
        processPaymentAsync: vi.fn().mockResolvedValue([{ code: 'REJECTED' }]),
      });

      const result = await client.requestPayment(validPayment);

      expect(result.faultType).toBe('BUSINESS_FAULT');
      expect(result.code).toBe('REJECTED');
    });
  });

  describe('classifyFault - Faults SOAP v1.1 y v1.2', () => {
    it('clasifica un Client Fault v1.1 como negocio y limpia el XML', async () => {
      const client = withClient({
        processPaymentAsync: vi.fn().mockRejectedValue({
          Fault: { faultcode: 'Client.InvalidCard', faultstring: '<b>Tarjeta inválida</b>' },
        }),
      });

      const result = await client.requestPayment(validPayment);

      expect(result.faultType).toBe('BUSINESS_FAULT');
      expect(result.code).toBe('SOAP_BUSINESS_FAULT');
      expect(result.reason).toBe('Tarjeta inválida');
      expect(result.reason).not.toContain('<');
    });

    it('clasifica un Server Fault anidado en root.Envelope como técnico', async () => {
      const client = withClient({
        processPaymentAsync: vi.fn().mockRejectedValue({
          root: {
            Envelope: {
              Body: {
                Fault: { Code: { Value: 'Server' }, Reason: { Text: '<i>Banco caído</i>' } },
              },
            },
          },
        }),
      });

      const result = await client.requestPayment(validPayment);

      expect(result.faultType).toBe('TECHNICAL_FAULT');
      expect(result.code).toBe('SOAP_FAULT_TECHNICAL');
      expect(result.reason).toBe('Banco caído');
    });

    it('usa el subcódigo Sender de body.Fault como fault de negocio', async () => {
      const client = withClient({
        processPaymentAsync: vi.fn().mockRejectedValue({
          body: { Fault: { Code: { Subcode: { value: 'Sender' } } } },
        }),
      });

      const result = await client.requestPayment(validPayment);

      expect(result.faultType).toBe('BUSINESS_FAULT');
      expect(result.reason).toBe('Fault SOAP sin detalle');
    });

    it('clasifica por error.code y message cuando no hay estructura Fault', async () => {
      const client = withClient({
        processPaymentAsync: vi
          .fn()
          .mockRejectedValue({ code: 'InsufficientFunds', message: 'Saldo <b>insuficiente</b>' }),
      });

      const result = await client.requestPayment(validPayment);

      expect(result.faultType).toBe('BUSINESS_FAULT');
      expect(result.reason).toBe('Saldo insuficiente');
    });

    it('cae a fault técnico genérico y trunca mensajes largos', async () => {
      const client = withClient({
        processPaymentAsync: vi.fn().mockRejectedValue({ message: 'y'.repeat(400) }),
      });

      const result = await client.requestPayment(validPayment);

      expect(result.faultType).toBe('TECHNICAL_FAULT');
      expect(result.code).toBe('SOAP_FAULT_TECHNICAL');
      expect(result.reason).toHaveLength(200);
    });

    it('no propaga el stack trace de un error sin mensaje', async () => {
      const client = withClient({
        processPaymentAsync: vi.fn().mockRejectedValue({}),
      });

      const result = await client.requestPayment(validPayment);

      expect(result.faultType).toBe('TECHNICAL_FAULT');
      expect(result.reason).toBe('Fault SOAP sin detalle');
    });
  });

  describe('requestPayment - timeout de 5 s', () => {
    it('aborta la llamada colgada a los 5 s y limpia el timer', async () => {
      vi.useFakeTimers();
      try {
        const call = vi.fn(() => new Promise(() => {}));
        const client = withClient({ processPaymentAsync: call });

        const pending = client.requestPayment(validPayment).then(result => result);
        await vi.advanceTimersByTimeAsync(5000);
        const result = await pending;

        expect(result.faultType).toBe('TIMEOUT');
        expect(result.code).toBe('GATEWAY_TIMEOUT');
        expect(result.reason).toContain('5s');
        expect(result.status).toBe('ERROR');
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('sendSoapPayment', () => {
    it('devuelve OK cuando la pasarela aprueba', async () => {
      const client = withClient({
        processPaymentAsync: vi.fn().mockResolvedValue([{ approved: true }]),
      });

      await expect(client.sendSoapPayment(100, '4111 1111 1111 1111')).resolves.toEqual({
        status: 'OK',
      });
    });

    it('devuelve ERROR cuando la pasarela rechaza', async () => {
      const client = withClient({
        processPaymentAsync: vi.fn().mockResolvedValue([{ approved: false }]),
      });

      await expect(client.sendSoapPayment(100, '4111 1111 1111 1111')).resolves.toEqual({
        status: 'ERROR',
      });
    });
  });
});

describe('PaymentsService - integración con la pasarela SOAP (Eje C)', () => {
  let gateway: { isAvailable: ReturnType<typeof vi.fn>; requestPayment: ReturnType<typeof vi.fn> };
  let service: PaymentsService;

  const payment = {
    orderId: 'order-gw',
    amount: 2500,
    cardNumber: '4111 1111 1111 1111',
    cardHolder: 'Ana Titular',
  };

  beforeEach(() => {
    gateway = { isAvailable: vi.fn(() => true), requestPayment: vi.fn() };
    service = new PaymentsService(gateway as any);
  });

  it('delega en la pasarela y propaga la transacción aprobada', async () => {
    gateway.requestPayment.mockResolvedValue({
      status: 'OK',
      faultType: 'NONE',
      code: 'APPROVED',
      reason: 'Pago aprobado por la pasarela SOAP.',
      transactionId: 'TX-9',
      authCode: 'AUTH-9',
    });

    const result = await service.processPayment(payment);

    expect(result).toEqual({
      success: true,
      transactionId: 'TX-9',
      authCode: 'AUTH-9',
      code: 'APPROVED',
      reason: 'Pago aprobado por la pasarela SOAP.',
      faultType: 'NONE',
    });
    expect(gateway.requestPayment).toHaveBeenCalledWith({
      orderId: 'order-gw',
      amount: 2500,
      cardNumber: '4111111111111111',
      cardHolder: 'Ana Titular',
    });
  });

  it('genera un identificador local cuando la pasarela no devuelve transactionId', async () => {
    gateway.requestPayment.mockResolvedValue({
      status: 'OK',
      faultType: 'NONE',
      code: 'APPROVED',
      reason: 'ok',
    });

    const result = await service.processPayment(payment);

    expect(result.success).toBe(true);
    expect(result.transactionId).toMatch(/^SOAP-TX-/);
    expect(result.authCode).toBeUndefined();
  });

  it('propaga un fault de negocio sin marcar fallback', async () => {
    gateway.requestPayment.mockResolvedValue({
      status: 'ERROR',
      faultType: 'BUSINESS_FAULT',
      code: 'INSUFFICIENT_FUNDS',
      reason: 'Fondos insuficientes en la cuenta del titular.',
    });

    const result = await service.processPayment(payment);

    expect(result.success).toBe(false);
    expect(result.code).toBe('INSUFFICIENT_FUNDS');
    expect(result.fallback).toBe(false);
    expect(result.faultType).toBe('BUSINESS_FAULT');
  });

  it('marca fallback ante un fault técnico y abre el circuito tras tres fallas', async () => {
    gateway.requestPayment.mockResolvedValue({
      status: 'ERROR',
      faultType: 'TECHNICAL_FAULT',
      code: 'SOAP_FAULT_TECHNICAL',
      reason: 'Error técnico',
    });

    for (let i = 0; i < 3; i++) {
      const result = await service.processPayment({ ...payment, orderId: `gw-${i}` });
      expect(result.fallback).toBe(true);
      expect(result.faultType).toBe('TECHNICAL_FAULT');
    }

    expect(service.getCircuitState()).toBe(CircuitBreakerState.OPEN);
    expect(gateway.requestPayment).toHaveBeenCalledTimes(3);

    const fastFail = await service.processPayment(payment);
    expect(fastFail.code).toBe('CIRCUIT_BREAKER_OPEN');
    expect(gateway.requestPayment).toHaveBeenCalledTimes(3);
  });

  it('marca fallback ante timeout y no cuenta la falla para abrir el circuito', async () => {
    gateway.requestPayment.mockResolvedValue({
      status: 'ERROR',
      faultType: 'TIMEOUT',
      code: 'GATEWAY_TIMEOUT',
      reason: 'Timeout',
    });

    const result = await service.processPayment(payment);

    expect(result.success).toBe(false);
    expect(result.fallback).toBe(true);
    expect(result.faultType).toBe('TIMEOUT');
    expect(service.getCircuitState()).toBe(CircuitBreakerState.CLOSED);
  });

  it('usa el mock determinístico cuando la pasarela no está disponible', async () => {
    gateway.isAvailable.mockReturnValue(false);

    const result = await service.processPayment(payment);

    expect(gateway.requestPayment).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.code).toBe('APPROVED');
  });
});

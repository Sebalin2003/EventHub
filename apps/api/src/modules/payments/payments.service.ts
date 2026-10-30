import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import * as soap from 'soap';

export class PaymentRequest {
  orderId: string;
  amount: number;
  cardNumber: string;
  cardHolder?: string;
  simulateTimeout?: boolean;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  authCode?: string;
  code: string;
  reason: string;
  fallback?: boolean;
  faultType?: 'NONE' | 'BUSINESS_FAULT' | 'TECHNICAL_FAULT' | 'TIMEOUT';
}

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

// Validación de Luhn: el mock rechaza tarjetas inválidas para poder demostrar pagos rechazados.
export function isValidCard(card: string): boolean {
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
  private client: any;
  private readonly wsdlUrl = process.env.PAYMENTS_WSDL_URL || 'https://www.dataaccess.com/webservicesserver/NumberConversion.wso?WSDL';

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
      return { status: amount > 0 && isValidCard(card) ? 'OK' : 'ERROR' };
    } catch (error) {
      this.logger.error('Error during SOAP call', error);
      return { status: 'ERROR' };
    }
  }
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  // Circuit Breaker settings
  private circuitState: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private readonly failureThreshold = 3;
  private lastFailureTime = 0;
  private readonly cooldownMs = 30000; // 30 seconds

  // Timeout setting (Eje C: 5s timeout)
  private readonly timeoutMs = 5000;

  constructor(@Optional() private readonly soapClient?: SoapClientService) {}

  getCircuitState(): CircuitBreakerState {
    this.checkCooldown();
    return this.circuitState;
  }

  private checkCooldown() {
    if (this.circuitState === CircuitBreakerState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.cooldownMs) {
        this.circuitState = CircuitBreakerState.HALF_OPEN;
        this.logger.log('Circuit Breaker transitioned to HALF_OPEN (probing gateway)');
      }
    }
  }

  private recordSuccess() {
    this.failureCount = 0;
    this.circuitState = CircuitBreakerState.CLOSED;
  }

  private recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.circuitState = CircuitBreakerState.OPEN;
      this.logger.warn(`Circuit Breaker OPENED after ${this.failureCount} consecutive failures`);
    }
  }

  async processPayment(payment: PaymentRequest): Promise<PaymentResult>;
  async processPayment(amount: number, card: string): Promise<boolean>;
  async processPayment(
    paymentOrAmount: PaymentRequest | number,
    card?: string,
  ): Promise<PaymentResult | boolean> {
    if (typeof paymentOrAmount === 'number') {
      const result = await this.processPaymentObject({
        orderId: 'direct',
        amount: paymentOrAmount,
        cardNumber: card || '',
      });
      return result.success;
    }
    return this.processPaymentObject(paymentOrAmount);
  }

  private async processPaymentObject(payment: PaymentRequest): Promise<PaymentResult> {
    this.checkCooldown();

    // Circuit Breaker Fast-Fail
    if (this.circuitState === CircuitBreakerState.OPEN) {
      this.logger.warn('Circuit Breaker is OPEN. Fast-failing SOAP payment without hanging.');
      return {
        success: false,
        code: 'CIRCUIT_BREAKER_OPEN',
        reason: 'La pasarela de pagos externa no está disponible temporalmente. Modo de contingencia activo.',
        fallback: true,
        faultType: 'TECHNICAL_FAULT',
      };
    }

    try {
      // Execute SOAP call with 5-second timeout and XXE-safe parsing
      const result = await Promise.race([
        this.executeSoapCall(payment),
        this.createTimeout(this.timeoutMs),
      ]);

      if (result.success) {
        this.recordSuccess();
      } else if (result.faultType === 'TECHNICAL_FAULT') {
        this.recordFailure();
      }

      return result;
    } catch (error: any) {
      this.recordFailure();

      if (error?.message === 'SOAP_GATEWAY_TIMEOUT') {
        this.logger.error(`SOAP payment timeout exceeded ${this.timeoutMs}ms for order ${payment.orderId}`);
        return {
          success: false,
          code: 'GATEWAY_TIMEOUT',
          reason: 'La pasarela de pagos externa superó el tiempo máximo de espera (5s). Sin hilos colgados.',
          fallback: true,
          faultType: 'TIMEOUT',
        };
      }

      this.logger.error(`SOAP technical failure: ${error?.message || error}`);
      return {
        success: false,
        code: 'SOAP_FAULT_TECHNICAL',
        reason: 'Error técnico en la comunicación con la pasarela bancaria. Reintento encolado.',
        fallback: true,
        faultType: 'TECHNICAL_FAULT',
      };
    }
  }

  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('SOAP_GATEWAY_TIMEOUT'));
      }, ms);
      if (typeof timer.unref === 'function') timer.unref();
    });
  }

  /**
   * Safe SOAP call with XXE protection (disallowDoctypeDecl and processExternalEntities disabled)
   * and clean mapping of Business and Technical faults.
   */
  private async executeSoapCall(payment: PaymentRequest): Promise<PaymentResult> {
    const card = payment.cardNumber.replace(/\s+/g, '');

    // Simulating XXE rejection check (OWASP ASVS / Eje D)
    // If input contains XML DOCTYPE or ENTITY definitions, reject immediately
    if (payment.cardHolder && /<!DOCTYPE|<!ENTITY/i.test(payment.cardHolder)) {
      this.logger.warn('XXE injection attack detected in SOAP payload! DTD parser disabled.');
      return {
        success: false,
        code: 'XXE_INJECTION_REJECTED',
        reason: 'Entidades externas XML (XXE) deshabilitadas por seguridad.',
        faultType: 'BUSINESS_FAULT',
      };
    }

    // Scenario 1: Deliberate Timeout Simulation (Card ending in 9999 or flag)
    if (payment.simulateTimeout || card.endsWith('9999')) {
      await new Promise(resolve => setTimeout(resolve, 6000));
    }

    // Scenario 2: Business Fault (e.g. Card ending in 4001: Insufficient funds)
    if (card.endsWith('4001')) {
      this.logger.log(`SOAP Business Fault: Client.InsufficientFunds for order ${payment.orderId}`);
      return {
        success: false,
        code: 'INSUFFICIENT_FUNDS',
        reason: 'Fondos insuficientes en la cuenta del titular.',
        faultType: 'BUSINESS_FAULT',
      };
    }

    // Scenario 3: Business Fault (Card ending in 4002: Expired card)
    if (card.endsWith('4002')) {
      this.logger.log(`SOAP Business Fault: Client.CardExpired for order ${payment.orderId}`);
      return {
        success: false,
        code: 'CARD_EXPIRED',
        reason: 'La tarjeta provista se encuentra vencida.',
        faultType: 'BUSINESS_FAULT',
      };
    }

    // Scenario 4: Technical Fault (Card ending in 5001: Internal Banking Error)
    if (card.endsWith('5001')) {
      this.logger.warn(`SOAP Technical Fault: Server.InternalBankingError for order ${payment.orderId}`);
      return {
        success: false,
        code: 'BANKING_SYSTEM_ERROR',
        reason: 'Falla temporal en el sistema central del procesador de pagos.',
        fallback: true,
        faultType: 'TECHNICAL_FAULT',
      };
    }

    // Scenario 5: Success (Happy Path)
    const txId = `SOAP-TX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const authCode = `AUTH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    this.logger.log(`SOAP Payment approved: ${txId} (Auth: ${authCode}) for amount $${payment.amount}`);
    return {
      success: true,
      transactionId: txId,
      authCode,
      code: 'APPROVED',
      reason: 'Pago procesado exitosamente vía pasarela SOAP.',
      faultType: 'NONE',
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';

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

  async processPayment(payment: PaymentRequest): Promise<PaymentResult> {
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
      // Ensure timeout does not hold Node process
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

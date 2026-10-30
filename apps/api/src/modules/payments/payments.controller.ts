import { Controller, Post, Get, Body } from '@nestjs/common';
import { PaymentsService, PaymentRequest } from './payments.service.js';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('process')
  async processPayment(@Body() body: PaymentRequest) {
    return this.paymentsService.processPayment(body);
  }

  @Get('circuit-breaker')
  getCircuitStatus() {
    return {
      status: this.paymentsService.getCircuitState(),
      timestamp: new Date().toISOString(),
    };
  }
}

import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { IsNumber, IsPositive, Matches } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PaymentsService, PaymentRequest } from './payments.service.js';

export class PaymentDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @Matches(/^[\d ]{12,23}$/, { message: 'card must contain 12 to 19 digits' })
  card: string;
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('process')
  async processPayment(@Body() body: PaymentRequest) {
    return this.paymentsService.processPayment(body);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async process(@Body() body: PaymentDto) {
    const approved = await this.paymentsService.processPayment(body.amount, body.card);
    return { approved };
  }

  @Get('circuit-breaker')
  getCircuitStatus() {
    return {
      status: this.paymentsService.getCircuitState(),
      timestamp: new Date().toISOString(),
    };
  }
}

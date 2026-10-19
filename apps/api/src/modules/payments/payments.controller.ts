import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { IsNumber, IsPositive, Matches } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PaymentsService } from './payments.service.js';

export class PaymentDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @Matches(/^[\d ]{12,23}$/, { message: 'card must contain 12 to 19 digits' })
  card: string;
}

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Post()
  async process(@Body() body: PaymentDto) {
    return { approved: await this.paymentsService.processPayment(body.amount, body.card) };
  }
}

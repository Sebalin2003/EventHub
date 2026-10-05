import { Controller, Post, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Post()
  process(@Body() body: { amount: number, card: string }) {
    return this.paymentsService.processPayment(body.amount, body.card);
  }
}

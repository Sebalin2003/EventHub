import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { IsNumber, IsPositive, Matches } from 'class-validator';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../identity/entities/user.entity.js';
import { PaymentsService, PaymentRequest } from './payments.service.js';

export class PaymentDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @Matches(/^[\d ]{12,23}$/, { message: 'card must contain 12 to 19 digits' })
  card: string;
}

/**
 * Operaciones directas sobre la pasarela: solo para administración y diagnóstico.
 * Los compradores pagan siempre a través de POST /orders/:id/pay.
 * Sin esta restricción, cualquiera podía abrir el circuit breaker con tres
 * pagos fallidos y bloquear las compras de todos los usuarios.
 */
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('process')
  @HttpCode(HttpStatus.OK)
  async processPayment(@Body() body: PaymentRequest) {
    return this.paymentsService.processPayment(body);
  }

  @Post()
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

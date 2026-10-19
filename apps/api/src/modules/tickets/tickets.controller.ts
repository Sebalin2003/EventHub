import { Controller, Post, Get, Param, Body, Patch, Req, UseGuards } from '@nestjs/common';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../identity/entities/user.entity.js';
import { TicketsService } from './tickets.service.js';

export class EmitTicketsDto {
  @IsString()
  orderId: string;

  @IsUUID()
  eventId: string;

  @IsUUID()
  userId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  quantity?: number;
}

type AuthenticatedRequest = { user: { sub: string; role: UserRole } };

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) { }

  // Los tickets se emiten al pagar una orden (POST /orders/:id/pay); esto queda solo para el admin.
  @Post()
  @Roles(UserRole.ADMIN)
  emit(@Body() body: EmitTicketsDto) {
    return this.ticketsService.emit(body.orderId, body.eventId, body.userId, body.quantity ?? 1);
  }

  @Get('me')
  findMine(@Req() req: AuthenticatedRequest) {
    return this.ticketsService.findByUserId(req.user.sub);
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMIN)
  findByUser(@Param('userId') userId: string) {
    return this.ticketsService.findByUserId(userId);
  }

  @Patch(':id/cancel')
  cancel(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.ticketsService.cancel(id, { sub: req.user.sub, isAdmin: req.user.role === UserRole.ADMIN });
  }
}

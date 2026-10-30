import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { TicketsService } from './tickets.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  emit(@Body() body: { orderId: string; eventId: string; userId: string; quantity: number }) {
    return this.ticketsService.emit(body.orderId, body.eventId, body.userId, body.quantity || 1);
  }

  @Get('user/:userId')
  findByUser(@Request() req: any, @Param('userId') userId: string) {
    const currentUserId = req.user.sub || req.user.id;
    if (currentUserId !== userId && req.user.role !== 'admin' && req.user.role !== 'staff') {
      throw new ForbiddenException('Acceso denegado: No posee permisos para consultar entradas de otro usuario');
    }
    return this.ticketsService.findByUserId(userId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    const currentUserId = req.user.sub || req.user.id;
    return this.ticketsService.findById(id, currentUserId, req.user.role);
  }

  @Patch(':id/cancel')
  cancel(@Request() req: any, @Param('id') id: string) {
    const currentUserId = req.user.sub || req.user.id;
    return this.ticketsService.cancel(id, currentUserId, req.user.role);
  }
}

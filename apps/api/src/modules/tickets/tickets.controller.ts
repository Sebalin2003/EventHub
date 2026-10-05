import { Controller, Post, Get, Param, Body, Patch } from '@nestjs/common';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  emit(@Body() body: { orderId: string, eventId: string, userId: string, quantity: number }) {
    return this.ticketsService.emit(body.orderId, body.eventId, body.userId, body.quantity || 1);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.ticketsService.findByUserId(userId);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.ticketsService.cancel(id);
  }
}

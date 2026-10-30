import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { TicketsService } from '../tickets/tickets.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../identity/entities/user.entity.js';

@Controller('check-in')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CheckInController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post(':ticketId/scan')
  @Roles(UserRole.STAFF, UserRole.ORGANIZER, UserRole.ADMIN)
  async scan(@Param('ticketId') ticketId: string) {
    const ticket = await this.ticketsService.useTicket(ticketId);
    return {
      success: true,
      ticketId: ticket.id,
      code: ticket.code,
      status: ticket.status,
      scannedAt: ticket.scannedAt,
      message: 'Entrada validada correctamente. Acceso autorizado al evento.',
    };
  }
}

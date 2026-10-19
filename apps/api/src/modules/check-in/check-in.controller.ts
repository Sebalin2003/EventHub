import { Body, Controller, ForbiddenException, Post, Param, Req, UseGuards } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../identity/entities/user.entity.js';
import { EventDao } from '../events/event.dao.js';
import { TicketsService } from '../tickets/tickets.service.js';

export class ScanDto {
  // Evento en el que se está controlando el acceso (UUID o legacyId). Opcional.
  @IsOptional()
  @IsString()
  eventId?: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STAFF, UserRole.ORGANIZER, UserRole.ADMIN)
@Controller('check-in')
export class CheckInController {
  constructor(
    private readonly tickets: TicketsService,
    private readonly events: EventDao,
  ) {}

  // ticketId acepta el UUID del ticket o su código QR.
  @Post(':ticketId/scan')
  async scan(
    @Param('ticketId') ticketId: string,
    @Body() body: ScanDto,
    @Req() req: { user: { sub: string; role: UserRole } },
  ) {
    const event = body.eventId ? await this.events.findOne(body.eventId) : null;
    if (event && req.user.role === UserRole.ORGANIZER && event.organizerId !== req.user.sub) {
      throw new ForbiddenException('Not your event');
    }
    const { result, ticket } = await this.tickets.checkIn(ticketId, event?.id);
    return {
      success: result === 'ENTRADA_VALIDA',
      result,
      ticketId: ticket?.id ?? ticketId,
      eventId: ticket?.eventId ?? null,
      scannedAt: ticket?.scannedAt ?? null,
    };
  }
}

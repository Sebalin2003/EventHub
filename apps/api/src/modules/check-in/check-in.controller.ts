import {
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  NotFoundException,
  Post,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../identity/entities/user.entity.js';
import { EventDao } from '../events/event.dao.js';
import { TicketsService } from '../tickets/tickets.service.js';

export class ScanDto {
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

    // Las transiciones inválidas deben responder con el código HTTP correcto
    // (409 Conflict / 404 Not Found), no con un 201 que oculte el rechazo.
    if (result === 'ENTRADA_YA_UTILIZADA') {
      throw new ConflictException('Transición inválida: la entrada ya fue utilizada');
    }
    if (result === 'ENTRADA_EVENTO_INCORRECTO') {
      throw new ConflictException('La entrada pertenece a otro evento');
    }
    if (result === 'ENTRADA_INVALIDA') {
      throw new NotFoundException('Entrada inexistente o cancelada');
    }

    return {
      success: true,
      result,
      ticketId: ticket?.id ?? ticketId,
      code: ticket?.code ?? null,
      eventId: ticket?.eventId ?? null,
      scannedAt: ticket?.scannedAt ?? null,
      message: 'Entrada validada correctamente',
    };
  }
}

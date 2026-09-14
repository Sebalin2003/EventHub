import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../identity/entities/user.entity.js';
import { Event } from './entities/event.entity.js';
import { EventsService } from './events.service.js';

type AuthenticatedRequest = { user?: { sub: string } };

@Controller('organizer/events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ORGANIZER)
export class OrganizerEventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  list(@Req() req: AuthenticatedRequest) {
    return this.eventsService.listByOrganizer(req.user!.sub);
  }

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() body: Partial<Event>) {
    return this.eventsService.createForOrganizer(req.user!.sub, body);
  }

  @Patch(':eventId')
  update(@Req() req: AuthenticatedRequest, @Param('eventId') eventId: string, @Body() body: Partial<Event>) {
    return this.eventsService.updateOwned(req.user!.sub, eventId, body);
  }

  @Post(':eventId/publish')
  publish(@Req() req: AuthenticatedRequest, @Param('eventId') eventId: string) {
    return this.eventsService.publishOwned(req.user!.sub, eventId);
  }

  @Post(':eventId/cancel')
  cancel(@Req() req: AuthenticatedRequest, @Param('eventId') eventId: string) {
    return this.eventsService.cancelOwned(req.user!.sub, eventId);
  }
}
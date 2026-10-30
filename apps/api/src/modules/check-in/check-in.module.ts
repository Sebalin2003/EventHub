import { Module } from '@nestjs/common';
import { CheckInController } from './check-in.controller.js';
import { IdentityModule } from '../identity/identity.module.js';
import { EventsModule } from '../events/events.module.js';
import { TicketsModule } from '../tickets/tickets.module.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';

@Module({
  imports: [IdentityModule, EventsModule, TicketsModule],
  controllers: [CheckInController],
  providers: [JwtAuthGuard, RolesGuard],
})
export class CheckInModule {}

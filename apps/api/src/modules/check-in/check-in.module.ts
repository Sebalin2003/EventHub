import { Module } from '@nestjs/common';
import { CheckInController } from './check-in.controller.js';
import { TicketsModule } from '../tickets/tickets.module.js';
import { IdentityModule } from '../identity/identity.module.js';

@Module({
  imports: [TicketsModule, IdentityModule],
  controllers: [CheckInController],
})
export class CheckInModule {}

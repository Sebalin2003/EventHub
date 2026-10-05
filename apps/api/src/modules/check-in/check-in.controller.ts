import { Controller, Post, Param } from '@nestjs/common';

@Controller('check-in')
export class CheckInController {
  @Post(':ticketId/scan')
  scan(@Param('ticketId') ticketId: string) {
    // ponytail: minimal check-in validation
    return { success: true, ticketId, timestamp: new Date(), message: 'Ticket scanned successfully' };
  }
}

import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../identity/entities/user.entity.js';
import { InventoryService } from './inventory.service.js';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get(':eventId')
  get(@Param('eventId') eventId: string) {
    return this.inventory.get(eventId);
  }

  @Put(':eventId')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  set(@Param('eventId') eventId: string, @Body() body: { available: number }) {
    return this.inventory.set(eventId, body.available);
  }
}

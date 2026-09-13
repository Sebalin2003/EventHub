import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../identity/entities/user.entity.js';
import { InventoryService } from './inventory.service.js';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Post(':eventId/holds')
  createHold(
    @Param('eventId') eventId: string,
    @Req() req: { user: { sub: string } },
    @Body() body: { quantity: number; ttlSeconds?: number },
  ) {
    const ttlMs = body.ttlSeconds === undefined ? undefined : body.ttlSeconds * 1000;
    return this.inventory.createHold(eventId, req.user.sub, body.quantity, ttlMs);
  }

  @Delete(':eventId/holds/:holdId')
  releaseHold(
    @Param('eventId') eventId: string,
    @Param('holdId') holdId: string,
    @Req() req: { user: { sub: string } },
  ) {
    return this.inventory.releaseHold(eventId, holdId, req.user.sub);
  }

  @Post(':eventId/holds/:holdId/commit')
  commitHold(
    @Param('eventId') eventId: string,
    @Param('holdId') holdId: string,
    @Req() req: { user: { sub: string } },
  ) {
    return this.inventory.commitHold(eventId, holdId, req.user.sub);
  }

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

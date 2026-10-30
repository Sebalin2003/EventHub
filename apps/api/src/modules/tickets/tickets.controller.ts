import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Patch,
  Req,
  Request,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../identity/entities/user.entity.js';
import { TicketsService } from './tickets.service.js';

export class EmitTicketsDto {
  @IsString()
  orderId: string;

  @IsUUID()
  eventId: string;

  @IsUUID()
  userId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  quantity?: number;
}

type AuthenticatedRequest = { user: { sub: string; role: UserRole } };

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  emit(@Body() body: EmitTicketsDto) {
    return this.ticketsService.emit(body.orderId, body.eventId, body.userId, body.quantity ?? 1);
  }

  @Get('me')
  findMine(@Req() req: AuthenticatedRequest) {
    return this.ticketsService.findByUserId(req.user.sub);
  }

  @Get('user/:userId')
  findByUser(@Request() req: any, @Param('userId') userId: string) {
    const currentUserId = req.user.sub || req.user.id;
    if (currentUserId !== userId && req.user.role !== 'admin' && req.user.role !== 'staff') {
      throw new ForbiddenException('Acceso denegado: No posee permisos para consultar entradas de otro usuario');
    }
    return this.ticketsService.findByUserId(userId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    const currentUserId = req.user.sub || req.user.id;
    return this.ticketsService.findById(id, currentUserId, req.user.role);
  }

  @Patch(':id/cancel')
  cancel(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.ticketsService.cancel(id, { sub: req.user.sub, isAdmin: req.user.role === UserRole.ADMIN });
  }
}

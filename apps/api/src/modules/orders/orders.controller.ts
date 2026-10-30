import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Headers,
  UseGuards,
  Request,
  Response,
  PreconditionFailedException,
  ValidationPipe,
} from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { OrdersService, Buyer } from './orders.service.js';
import { CreateOrderDto, PayOrderDto } from './dto/create-order.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(
    @Request() req: any,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) createOrderDto: CreateOrderDto,
  ) {
    const buyer: Buyer = {
      sub: req.user.sub || req.user.id,
      email: req.user.email || 'user@example.com',
    };
    return this.ordersService.create(buyer, createOrderDto, idempotencyKey);
  }

  @Get()
  async findAll(@Request() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.ordersService.findAllByUser(userId);
  }

  @Get(':id')
  async findOne(
    @Request() req: any,
    @Param('id') id: string,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const userId = req.user.sub || req.user.id;
    const role = req.user.role;
    const order = await this.ordersService.findOne(id, userId, role);

    const etag = `W/"${order.version}"`;
    res.setHeader('ETag', etag);
    return order;
  }

  @Patch(':id/pay')
  async payPatch(
    @Request() req: any,
    @Param('id') id: string,
    @Headers('if-match') ifMatch?: string,
  ) {
    return this.handlePay(req, id, ifMatch);
  }

  @Post(':id/pay')
  async payPost(
    @Request() req: any,
    @Param('id') id: string,
    @Headers('if-match') ifMatch?: string,
    @Body() body?: PayOrderDto,
  ) {
    return this.handlePay(req, id, ifMatch, body?.card);
  }

  private async handlePay(req: any, id: string, ifMatch?: string, card?: string) {
    const userId = req.user.sub || req.user.id;
    const buyer: Buyer = {
      sub: userId,
      email: req.user.email || 'user@example.com',
    };
    const order = await this.ordersService.findOne(id, userId, req.user.role);

    // ETag Concurrency validation (412 Precondition Failed)
    if (ifMatch) {
      const currentEtag = `W/"${order.version}"`;
      const cleanIfMatch = ifMatch.replace(/^W\//, '').replace(/"/g, '');
      const cleanCurrent = currentEtag.replace(/^W\//, '').replace(/"/g, '');
      if (cleanIfMatch !== cleanCurrent) {
        throw new PreconditionFailedException('Actualización concurrente rechazada: El ETag provisto está desactualizado.');
      }
    }

    if (card) {
      return this.ordersService.pay(id, buyer, card);
    }
    return this.ordersService.payOrder(id, userId);
  }

  @Patch(':id/cancel')
  async cancelPatch(
    @Request() req: any,
    @Param('id') id: string,
    @Headers('if-match') ifMatch?: string,
  ) {
    return this.handleCancel(req, id, ifMatch);
  }

  @Post(':id/cancel')
  async cancelPost(
    @Request() req: any,
    @Param('id') id: string,
    @Headers('if-match') ifMatch?: string,
  ) {
    return this.handleCancel(req, id, ifMatch);
  }

  private async handleCancel(req: any, id: string, ifMatch?: string) {
    const userId = req.user.sub || req.user.id;
    const order = await this.ordersService.findOne(id, userId, req.user.role);

    if (ifMatch) {
      const cleanIfMatch = ifMatch.replace(/^W\//, '').replace(/"/g, '');
      const cleanCurrent = String(order.version);
      if (cleanIfMatch !== cleanCurrent) {
        throw new PreconditionFailedException('Actualización concurrente rechazada: El ETag provisto está desactualizado.');
      }
    }

    return this.ordersService.cancelOrder(id, userId);
  }

  @Patch(':id/refund')
  async refund(
    @Request() req: any,
    @Param('id') id: string,
    @Headers('if-match') ifMatch?: string,
  ) {
    const userId = req.user.sub || req.user.id;
    const order = await this.ordersService.findOne(id, userId, req.user.role);

    if (ifMatch) {
      const cleanIfMatch = ifMatch.replace(/^W\//, '').replace(/"/g, '');
      const cleanCurrent = String(order.version);
      if (cleanIfMatch !== cleanCurrent) {
        throw new PreconditionFailedException('Actualización concurrente rechazada: El ETag provisto está desactualizado.');
      }
    }

    return this.ordersService.refundOrder(id, userId);
  }
}

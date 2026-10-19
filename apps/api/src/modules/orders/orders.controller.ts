import { Controller, Post, Get, Param, Body, UseGuards, Request, NotFoundException, ParseUUIDPipe } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto, PayOrderDto } from './dto/create-order.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

type AuthenticatedRequest = { user: { sub: string; email: string } };

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post()
  async create(@Request() req: AuthenticatedRequest, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(req.user, createOrderDto);
  }

  @Get()
  async findAll(@Request() req: AuthenticatedRequest) {
    return this.ordersService.findAllByUser(req.user.sub);
  }

  @Get(':id')
  async findOne(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    const order = await this.ordersService.findOne(id, req.user.sub);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  @Post(':id/pay')
  async pay(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string, @Body() body: PayOrderDto) {
    return this.ordersService.pay(id, req.user, body.card);
  }

  @Post(':id/cancel')
  async cancel(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.cancel(id, req.user.sub);
  }
}

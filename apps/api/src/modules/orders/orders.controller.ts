import { Controller, Post, Get, Param, Body, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post()
  async create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    const userId = req.user.id;
    return this.ordersService.create(userId, createOrderDto);
  }

  @Get()
  async findAll(@Request() req) {
    const userId = req.user.id;
    return this.ordersService.findAllByUser(userId);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const userId = req.user.id;
    const order = await this.ordersService.findOne(id, userId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Event } from './entities/event.entity.js';
import { EventsService } from './events.service.js';

@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  findAll() {
    return this.events.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.events.findOne(id);
  }

  @Post()
  create(@Body() body: Partial<Event>) {
    return this.events.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<Event>) {
    return this.events.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.events.remove(id);
  }
}

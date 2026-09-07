import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity.js';

@Injectable()
export class EventsService {
  constructor(@InjectRepository(Event) private readonly events: Repository<Event>) {}

  findAll() {
    return this.events.find({ order: { date: 'ASC' } });
  }

  async findOne(id: string) {
    const event = await this.events.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  create(data: Partial<Event>) {
    return this.events.save(this.events.create(data));
  }

  async update(id: string, data: Partial<Event>) {
    const event = await this.findOne(id);
    Object.assign(event, data);
    return this.events.save(event);
  }

  async remove(id: string) {
    await this.events.delete((await this.findOne(id)).id);
  }
}

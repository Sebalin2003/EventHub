import { Injectable } from '@nestjs/common';
import { Event } from './entities/event.entity.js';
import { EventDao } from './event.dao.js';
import { EventFactory } from './event.factory.js';

@Injectable()
export class EventsService {
  constructor(
    private readonly eventDao: EventDao,
    private readonly eventFactory: EventFactory,
  ) {}

  findAll() {
    return this.eventDao.findAll();
  }

  async findOne(id: string) {
    return this.eventDao.findOne(id);
  }

  create(data: Partial<Event>) {
    const event = this.eventFactory.createEvent(data);
    return this.eventDao.save(event);
  }

  async update(id: string, data: Partial<Event>) {
    const event = await this.findOne(id);
    Object.assign(event, data);
    return this.eventDao.save(event);
  }

  async remove(id: string) {
    await this.eventDao.delete(id);
  }
}

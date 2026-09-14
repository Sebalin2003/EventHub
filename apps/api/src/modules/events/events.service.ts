import { ForbiddenException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Event, EventStatus } from './entities/event.entity.js';
import { EventDao } from './event.dao.js';
import { EventFactory } from './event.factory.js';

@Injectable()
export class EventsService implements OnModuleInit {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly eventDao: EventDao,
    private readonly eventFactory: EventFactory,
  ) {}

  onModuleInit() {
    this.logger.log('Events service initialized');
  }

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

  listByOrganizer(organizerId: string) {
    return this.eventDao.findByOrganizer(organizerId);
  }

  createForOrganizer(organizerId: string, data: Partial<Event>) {
    const event = this.eventFactory.createEvent({
      ...data,
      organizerId,
      status: data.status ?? EventStatus.DRAFT,
    });
    return this.eventDao.save(event);
  }

  private async owned(eventId: string, organizerId: string): Promise<Event> {
    const event = await this.eventDao.findOne(eventId);
    if (event.organizerId !== organizerId) {
      throw new ForbiddenException('Not your event');
    }
    return event;
  }

  async updateOwned(organizerId: string, eventId: string, data: Partial<Event>) {
    const event = await this.owned(eventId, organizerId);
    Object.assign(event, data, { organizerId });
    return this.eventDao.save(event);
  }

  async publishOwned(organizerId: string, eventId: string) {
    const event = await this.owned(eventId, organizerId);
    event.status = EventStatus.PUBLISHED;
    return this.eventDao.save(event);
  }

  async cancelOwned(organizerId: string, eventId: string) {
    const event = await this.owned(eventId, organizerId);
    event.status = EventStatus.CANCELLED;
    return this.eventDao.save(event);
  }
}

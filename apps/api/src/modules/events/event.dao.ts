import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity.js';

@Injectable()
export class EventDao {
  constructor(@InjectRepository(Event) private readonly repository: Repository<Event>) {}

  async findAll(): Promise<Event[]> {
    return this.repository.find({ order: { date: 'ASC' } });
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.repository.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  findByLegacyId(legacyId: string) {
    return this.repository.findOne({ where: { legacyId } });
  }

  async save(event: Event): Promise<Event> {
    return this.repository.save(event);
  }

  async delete(id: string): Promise<void> {
    const event = await this.findOne(id);
    await this.repository.delete(event.id);
  }
}

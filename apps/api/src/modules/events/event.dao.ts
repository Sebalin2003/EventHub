import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Event, EventStatus } from './entities/event.entity.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class EventDao {
  constructor(@InjectRepository(Event) private readonly repository: Repository<Event>) {}

  async findAll(): Promise<Event[]> {
    return this.repository.find({ order: { date: 'ASC' } });
  }

  // Catálogo público: los borradores solo los ve su organizador.
  async findVisible(): Promise<Event[]> {
    return this.repository.find({
      where: { status: In([EventStatus.PUBLISHED, EventStatus.CANCELLED, EventStatus.COMPLETED]) },
      order: { date: 'ASC' },
    });
  }

  // Acepta el UUID o el legacyId del seed (e1, e2...) que usa el frontend.
  async findOne(id: string): Promise<Event> {
    const event = await this.repository.findOne({ where: UUID.test(id) ? { id } : { legacyId: id } });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  findByLegacyId(legacyId: string) {
    return this.repository.findOne({ where: { legacyId } });
  }

  findByOrganizer(organizerId: string): Promise<Event[]> {
    return this.repository.find({ where: { organizerId }, order: { date: 'ASC' } });
  }

  async save(event: Event): Promise<Event> {
    return this.repository.save(event);
  }

  async delete(id: string): Promise<void> {
    const event = await this.findOne(id);
    await this.repository.delete(event.id);
  }
}

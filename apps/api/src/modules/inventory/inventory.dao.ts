import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './entities/inventory.entity.js';

@Injectable()
export class InventoryDao {
  constructor(@InjectRepository(Inventory) private readonly repository: Repository<Inventory>) {}

  findOne(eventId: string) {
    return this.repository.findOne({ where: { eventId } });
  }

  async save(data: Partial<Inventory>) {
    const existing = data.eventId ? await this.findOne(data.eventId) : null;
    return this.repository.save(existing ? Object.assign(existing, data) : this.repository.create(data));
  }
}

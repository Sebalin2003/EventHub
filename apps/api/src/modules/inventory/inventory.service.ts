import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InventoryDao } from './inventory.dao.js';

@Injectable()
export class InventoryService implements OnModuleInit, OnModuleDestroy {
  private initialized = false;
  constructor(private readonly inventoryDao: InventoryDao) {}

  onModuleInit() {
    this.initialized = true;
  }

  onModuleDestroy() {
    this.initialized = false;
  }

  async get(eventId: string) {
    const inventory = await this.inventoryDao.findOne(eventId);
    return { eventId, available: inventory?.available ?? 0 };
  }

  async set(eventId: string, available: number) {
    if (!this.initialized) throw new Error('Inventory is not initialized');
    await this.inventoryDao.save({ eventId, available });
    return { eventId, available };
  }
}

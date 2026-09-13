import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { InventoryDao } from './inventory.dao.js';

export type InventoryHold = {
  id: string;
  eventId: string;
  userId: string;
  quantity: number;
  status: 'active' | 'released' | 'committed';
  createdAt: string;
  expiresAt: string;
};

const DEFAULT_HOLD_TTL_MS = 5 * 60 * 1000;
const HOLD_EXPIRY_CHECK_MS = 1000;

@Injectable()
export class InventoryService implements OnModuleInit, OnModuleDestroy {
  private initialized = false;
  private readonly activeHolds = new Map<string, InventoryHold>();
  private expiryTimer?: NodeJS.Timeout;
  private mutationQueue: Promise<void> = Promise.resolve();

  constructor(private readonly inventoryDao: InventoryDao) {}

  onModuleInit() {
    this.initialized = true;
    this.expiryTimer = setInterval(() => this.expireHolds(), HOLD_EXPIRY_CHECK_MS);
    this.expiryTimer.unref();
  }

  onModuleDestroy() {
    if (this.expiryTimer) clearInterval(this.expiryTimer);
    this.expiryTimer = undefined;
    this.activeHolds.clear();
    this.initialized = false;
  }

  async get(eventId: string) {
    this.expireHolds();
    const inventory = await this.inventoryDao.findOne(eventId);
    const totalAvailable = inventory?.available ?? 0;
    const held = this.getHeldQuantity(eventId);
    return { eventId, available: Math.max(0, totalAvailable - held), held, totalAvailable };
  }

  async set(eventId: string, available: number) {
    this.ensureInitialized();
    if (!Number.isInteger(available) || available < 0) {
      throw new BadRequestException('Available must be a non-negative integer');
    }

    return this.serializeMutation(async () => {
      this.expireHolds();
      if (available < this.getHeldQuantity(eventId)) {
        throw new ConflictException('Available inventory cannot be lower than active holds');
      }

      await this.inventoryDao.save({ eventId, available });
      return { eventId, available };
    });
  }

  async createHold(eventId: string, userId: string, quantity: number, ttlMs = DEFAULT_HOLD_TTL_MS) {
    this.ensureInitialized();
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new BadRequestException('Quantity must be a positive integer');
    }
    if (!Number.isInteger(ttlMs) || ttlMs <= 0 || ttlMs > DEFAULT_HOLD_TTL_MS) {
      throw new BadRequestException('Hold duration must be between 1 ms and 5 minutes');
    }

    return this.serializeMutation(async () => {
      this.expireHolds();
      const inventory = await this.inventoryDao.findOne(eventId);
      const available = (inventory?.available ?? 0) - this.getHeldQuantity(eventId);
      if (quantity > available) {
        throw new ConflictException('Not enough inventory available');
      }

      const now = Date.now();
      const hold: InventoryHold = {
        id: randomUUID(),
        eventId,
        userId,
        quantity,
        status: 'active',
        createdAt: new Date(now).toISOString(),
        expiresAt: new Date(now + ttlMs).toISOString(),
      };
      this.activeHolds.set(hold.id, hold);
      return hold;
    });
  }

  async releaseHold(eventId: string, holdId: string, userId: string) {
    this.ensureInitialized();
    return this.serializeMutation(async () => {
      const hold = this.requireOwnedHold(eventId, holdId, userId);
      this.activeHolds.delete(holdId);
      return { ...hold, status: 'released' as const };
    });
  }

  async commitHold(eventId: string, holdId: string, userId: string) {
    this.ensureInitialized();
    return this.serializeMutation(async () => {
      const hold = this.requireOwnedHold(eventId, holdId, userId);
      if (new Date(hold.expiresAt).getTime() <= Date.now()) {
        this.activeHolds.delete(holdId);
        throw new GoneException('Hold expired');
      }

      const inventory = await this.inventoryDao.findOne(eventId);
      const totalAvailable = inventory?.available ?? 0;
      if (hold.quantity > totalAvailable) {
        throw new ConflictException('Not enough inventory available');
      }

      await this.inventoryDao.save({ eventId, available: totalAvailable - hold.quantity });
      this.activeHolds.delete(holdId);
      return { ...hold, status: 'committed' as const };
    });
  }

  private getHeldQuantity(eventId: string) {
    let total = 0;
    for (const hold of this.activeHolds.values()) {
      if (hold.eventId === eventId) total += hold.quantity;
    }
    return total;
  }

  private expireHolds(now = Date.now()) {
    for (const [holdId, hold] of this.activeHolds) {
      if (new Date(hold.expiresAt).getTime() <= now) this.activeHolds.delete(holdId);
    }
  }

  private requireOwnedHold(eventId: string, holdId: string, userId: string) {
    const hold = this.activeHolds.get(holdId);
    if (!hold || hold.eventId !== eventId) throw new NotFoundException('Hold not found');
    if (hold.userId !== userId) throw new ForbiddenException('Hold belongs to another user');
    return hold;
  }

  private ensureInitialized() {
    if (!this.initialized) throw new Error('Inventory is not initialized');
  }

  private async serializeMutation<T>(operation: () => Promise<T>): Promise<T> {
    const previous = this.mutationQueue;
    let release: () => void;
    this.mutationQueue = new Promise(resolve => { release = resolve; });
    await previous;
    try {
      return await operation();
    } finally {
      release!();
    }
  }
}

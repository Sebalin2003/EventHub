import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../../identity/entities/user.entity.js';
import { OrderItem } from './order-item.entity.js';
import { createOrderState } from '../state/order-state.js';

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: Relation<User>;

  @Column()
  userId: string;

  @OneToMany(() => OrderItem, item => item.order, { cascade: true })
  items: Relation<OrderItem[]>;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ nullable: true, unique: true })
  idempotencyKey?: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  pay(): void {
    const state = createOrderState(this.status);
    this.status = state.pay();
    this.version++;
  }

  cancel(): void {
    const state = createOrderState(this.status);
    this.status = state.cancel();
    this.version++;
  }

  refund(): void {
    const state = createOrderState(this.status);
    this.status = state.refund();
    this.version++;
  }
}

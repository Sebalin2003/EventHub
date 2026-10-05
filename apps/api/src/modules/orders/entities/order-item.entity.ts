import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Order } from './order.entity.js';
import { Event } from '../../events/entities/event.entity.js';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, order => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Relation<Order>;

  @Column()
  orderId: string;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'eventId' })
  event: Relation<Event>;

  @Column()
  eventId: string;

  @Column()
  ticketType: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;
}

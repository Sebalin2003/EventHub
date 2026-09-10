import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../../identity/entities/user.entity.js';

export enum EventModality {
  ONLINE = 'online',
  IN_PERSON = 'in_person',
}

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  legacyId: string | null;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ default: 'conferencia' })
  category: string;

  @Column()
  date: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date | null;

  @Column({ type: 'int' }) // duration in minutes
  duration: number;

  @Column({ type: 'enum', enum: EventModality })
  modality: EventModality;

  @Column({ nullable: true })
  venue: string;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string | null;

  @Column({ default: false })
  featured: boolean;

  @Column({ type: 'int', default: 0 })
  registered: number;

  @Column({ type: 'varchar', nullable: true })
  organizerName: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  ticketTypes: Array<Record<string, unknown>>;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'enum', enum: EventStatus, default: EventStatus.DRAFT })
  status: EventStatus;

  @ManyToOne(() => User, user => user.events)
  @JoinColumn({ name: 'organizerId' })
  organizer: Relation<User>;

  @Column()
  organizerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

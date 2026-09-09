import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { Event } from '../../events/entities/event.entity.js';

export enum UserRole {
  ADMIN = 'admin',
  ORGANIZER = 'organizer',
  STAFF = 'staff',
  ATTENDEE = 'attendee',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.ATTENDEE })
  role: UserRole;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @OneToMany(() => Event, event => event.organizer)
  events: Relation<Event[]>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

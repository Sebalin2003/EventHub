import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../../identity/entities/user.entity.js';
import { Event } from '../../events/entities/event.entity.js';

@Entity('favorites')
@Unique('UQ_favorite_user_event', ['userId', 'eventId'])
export class Favorite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  eventId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: Relation<User>;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'eventId' })
  event: Relation<Event>;

  @CreateDateColumn()
  createdAt: Date;
}

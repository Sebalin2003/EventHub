import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  to: string;

  @Column()
  subject: string;

  @Column()
  template: string;

  @Column({ type: 'json' })
  payload: any;

  @CreateDateColumn()
  createdAt: Date;
}

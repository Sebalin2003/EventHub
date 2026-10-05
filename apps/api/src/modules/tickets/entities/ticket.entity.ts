import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column()
  eventId: string;

  @Column()
  userId: string;

  @Column({ default: 'EMITTED' })
  status: string; // EMITTED, CANCELLED, SCANNED

  @Column({ unique: true })
  code: string;

  @CreateDateColumn()
  createdAt: Date;
}

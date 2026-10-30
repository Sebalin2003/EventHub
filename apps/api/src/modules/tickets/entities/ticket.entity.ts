import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum TicketStatus {
  ISSUED = 'ISSUED',
  USED = 'USED',
  CANCELLED = 'CANCELLED',
}

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

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.ISSUED })
  status: TicketStatus;

  @Column({ unique: true })
  code: string;

  @Column({ nullable: true })
  scannedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

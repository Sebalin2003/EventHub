import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum TicketStatus {
  ISSUED = 'ISSUED',
  USED = 'USED',
  SCANNED = 'SCANNED',
  CANCELLED = 'CANCELLED',
  EMITTED = 'EMITTED',
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

  @Column({ type: 'varchar', nullable: true })
  ticketType: string | null;

  @Column({ default: 'ISSUED' })
  status: string; // ISSUED / EMITTED, CANCELLED, USED / SCANNED

  @Column({ unique: true })
  code: string;

  @Column({ type: 'timestamp', nullable: true })
  scannedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

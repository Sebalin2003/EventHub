import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export const OutboxStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
} as const;

export type OutboxStatusValue = (typeof OutboxStatus)[keyof typeof OutboxStatus];

/**
 * Outbox transaccional (Eje C): todo evento que debe publicarse en RabbitMQ
 * se persiste primero en PostgreSQL. Un dispatcher lo publica y lo marca SENT.
 * Si el broker está caído, el mensaje sobrevive en la base y se reintenta solo.
 */
@Entity('outbox_messages')
export class OutboxMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  topic: string;

  @Column({ type: 'json' })
  payload: Record<string, unknown>;

  @Column({ type: 'varchar', default: OutboxStatus.PENDING })
  status: OutboxStatusValue;

  @Column({ default: 0 })
  attempts: number;

  @Column({ type: 'text', nullable: true })
  lastError: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt: Date | null;
}

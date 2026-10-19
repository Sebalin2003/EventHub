import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from './entities/ticket.entity.js';
import { randomBytes } from 'crypto';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CheckInResult = 'ENTRADA_VALIDA' | 'ENTRADA_YA_UTILIZADA' | 'ENTRADA_INVALIDA' | 'ENTRADA_EVENTO_INCORRECTO';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketsRepository: Repository<Ticket>,
  ) { }

  async emit(orderId: string, eventId: string, userId: string, quantity: number, ticketType: string | null = null): Promise<Ticket[]> {
    const tickets = [];
    for (let i = 0; i < quantity; i++) {
      const ticket = this.ticketsRepository.create({
        orderId,
        eventId,
        userId,
        ticketType,
        code: randomBytes(16).toString('hex'),
      });
      tickets.push(ticket);
    }
    return this.ticketsRepository.save(tickets);
  }

  async findByUserId(userId: string): Promise<Ticket[]> {
    return this.ticketsRepository.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async findByOrder(orderId: string): Promise<Ticket[]> {
    return this.ticketsRepository.find({ where: { orderId } });
  }

  // Busca por id (UUID) o por el código que va en el QR.
  findByIdOrCode(idOrCode: string): Promise<Ticket | null> {
    return this.ticketsRepository.findOne({ where: UUID.test(idOrCode) ? { id: idOrCode } : { code: idOrCode } });
  }

  async cancel(id: string, actor: { sub: string; isAdmin: boolean }): Promise<Ticket> {
    const ticket = await this.findByIdOrCode(id);
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (!actor.isAdmin && ticket.userId !== actor.sub) throw new ForbiddenException('Ticket belongs to another user');
    ticket.status = 'CANCELLED';
    return this.ticketsRepository.save(ticket);
  }

  async checkIn(idOrCode: string, eventId?: string): Promise<{ result: CheckInResult; ticket: Ticket | null }> {
    const ticket = await this.findByIdOrCode(idOrCode);
    if (!ticket || ticket.status === 'CANCELLED') return { result: 'ENTRADA_INVALIDA', ticket };
    if (eventId && ticket.eventId !== eventId) return { result: 'ENTRADA_EVENTO_INCORRECTO', ticket };
    if (ticket.status === 'SCANNED') return { result: 'ENTRADA_YA_UTILIZADA', ticket };

    ticket.status = 'SCANNED';
    ticket.scannedAt = new Date();
    return { result: 'ENTRADA_VALIDA', ticket: await this.ticketsRepository.save(ticket) };
  }
}

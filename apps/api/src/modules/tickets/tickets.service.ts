import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket, TicketStatus } from './entities/ticket.entity.js';
import { randomBytes } from 'crypto';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CheckInResult = 'ENTRADA_VALIDA' | 'ENTRADA_YA_UTILIZADA' | 'ENTRADA_INVALIDA' | 'ENTRADA_EVENTO_INCORRECTO';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketsRepository: Repository<Ticket>,
  ) {}

  async emit(
    orderId: string,
    eventId: string,
    userId: string,
    quantity: number,
    ticketType: string | null = null,
  ): Promise<Ticket[]> {
    const tickets: Ticket[] = [];
    for (let i = 0; i < quantity; i++) {
      const ticket = this.ticketsRepository.create({
        orderId,
        eventId,
        userId,
        ticketType,
        status: TicketStatus.ISSUED,
        code: `EVT-${randomBytes(8).toString('hex').toUpperCase()}`,
      });
      tickets.push(ticket);
    }
    return this.ticketsRepository.save(tickets);
  }

  async findByUserId(userId: string): Promise<Ticket[]> {
    return this.ticketsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByOrder(orderId: string): Promise<Ticket[]> {
    return this.ticketsRepository.find({ where: { orderId } });
  }

  findByIdOrCode(idOrCode: string): Promise<Ticket | null> {
    return this.ticketsRepository.findOne({
      where: UUID.test(idOrCode) ? { id: idOrCode } : { code: idOrCode },
    });
  }

  async findById(id: string, requestingUserId?: string, role?: string): Promise<Ticket> {
    const ticket = await this.findByIdOrCode(id);
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID "${id}" not found`);
    }

    // OWASP BOLA / IDOR Verification
    if (requestingUserId && ticket.userId !== requestingUserId && role !== 'admin' && role !== 'staff') {
      throw new ForbiddenException('Acceso denegado: No posee permisos para acceder a esta entrada');
    }

    return ticket;
  }

  async cancel(id: string, actorOrUserId?: any, role?: string): Promise<Ticket> {
    const ticket = await this.findByIdOrCode(id);
    if (!ticket) throw new NotFoundException('Ticket not found');

    if (actorOrUserId && typeof actorOrUserId === 'object') {
      if (!actorOrUserId.isAdmin && ticket.userId !== actorOrUserId.sub) {
        throw new ForbiddenException('Ticket belongs to another user');
      }
    } else if (typeof actorOrUserId === 'string' && role !== 'admin' && role !== 'staff') {
      if (ticket.userId !== actorOrUserId) {
        throw new ForbiddenException('Ticket belongs to another user');
      }
    }

    if (ticket.status === TicketStatus.USED || ticket.status === 'SCANNED') {
      throw new ConflictException('Transición inválida: No se puede cancelar un ticket que ya fue utilizado');
    }

    ticket.status = TicketStatus.CANCELLED;
    return this.ticketsRepository.save(ticket);
  }

  async useTicket(id: string): Promise<Ticket> {
    const ticket = await this.findByIdOrCode(id);
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID "${id}" not found`);
    }

    // State Pattern Verification for Check-In
    if (ticket.status === TicketStatus.USED || ticket.status === 'SCANNED') {
      throw new ConflictException('Transición inválida: La entrada ya fue utilizada con anterioridad');
    }
    if (ticket.status === TicketStatus.CANCELLED) {
      throw new ConflictException('Transición inválida: La entrada ha sido cancelada y no es válida para ingresar');
    }

    ticket.status = TicketStatus.USED;
    ticket.scannedAt = new Date();
    return this.ticketsRepository.save(ticket);
  }

  async checkIn(idOrCode: string, eventId?: string): Promise<{ result: CheckInResult; ticket: Ticket | null }> {
    const ticket = await this.findByIdOrCode(idOrCode);
    if (!ticket || ticket.status === 'CANCELLED') return { result: 'ENTRADA_INVALIDA', ticket };
    if (eventId && ticket.eventId !== eventId) return { result: 'ENTRADA_EVENTO_INCORRECTO', ticket };
    if (ticket.status === 'SCANNED' || ticket.status === TicketStatus.USED) return { result: 'ENTRADA_YA_UTILIZADA', ticket };

    ticket.status = 'SCANNED';
    ticket.scannedAt = new Date();
    return { result: 'ENTRADA_VALIDA', ticket: await this.ticketsRepository.save(ticket) };
  }
}

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

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketsRepository: Repository<Ticket>,
  ) {}

  async emit(orderId: string, eventId: string, userId: string, quantity: number): Promise<Ticket[]> {
    const tickets: Ticket[] = [];
    for (let i = 0; i < quantity; i++) {
      const ticket = this.ticketsRepository.create({
        orderId,
        eventId,
        userId,
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

  async findById(id: string, requestingUserId?: string, role?: string): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findOne({ where: { id } });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID "${id}" not found`);
    }

    // OWASP BOLA / IDOR Verification
    if (requestingUserId && ticket.userId !== requestingUserId && role !== 'admin' && role !== 'staff') {
      throw new ForbiddenException('Acceso denegado: No posee permisos para acceder a esta entrada');
    }

    return ticket;
  }

  async cancel(id: string, userId?: string, role?: string): Promise<Ticket> {
    const ticket = await this.findById(id, userId, role);
    if (ticket.status === TicketStatus.USED) {
      throw new ConflictException('Transición inválida: No se puede cancelar un ticket que ya fue utilizado');
    }
    ticket.status = TicketStatus.CANCELLED;
    return this.ticketsRepository.save(ticket);
  }

  async useTicket(id: string): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findOne({ where: { id } });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID "${id}" not found`);
    }

    // State Pattern Verification for Check-In
    if (ticket.status === TicketStatus.USED) {
      throw new ConflictException('Transición inválida: La entrada ya fue utilizada con anterioridad');
    }
    if (ticket.status === TicketStatus.CANCELLED) {
      throw new ConflictException('Transición inválida: La entrada ha sido cancelada y no es válida para ingresar');
    }

    ticket.status = TicketStatus.USED;
    ticket.scannedAt = new Date();
    return this.ticketsRepository.save(ticket);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from './entities/ticket.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketsRepository: Repository<Ticket>,
  ) { }

  async emit(orderId: string, eventId: string, userId: string, quantity: number): Promise<Ticket[]> {
    const tickets = [];
    for (let i = 0; i < quantity; i++) {
      const ticket = this.ticketsRepository.create({
        orderId,
        eventId,
        userId,
        code: randomBytes(16).toString('hex'),
      });
      tickets.push(ticket);
    }
    return this.ticketsRepository.save(tickets);
  }

  async findByUserId(userId: string): Promise<Ticket[]> {
    return this.ticketsRepository.find({ where: { userId } });
  }

  async cancel(id: string): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    ticket.status = 'CANCELLED';
    return this.ticketsRepository.save(ticket);
  }
}

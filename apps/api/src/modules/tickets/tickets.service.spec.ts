import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TicketsService } from './tickets.service.js';
import { Ticket, TicketStatus } from './entities/ticket.entity.js';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('TicketsService (Eje B & Eje D: Entradas, Check-In y BOLA)', () => {
  let service: TicketsService;
  let ticketsRepo: any;

  beforeEach(() => {
    ticketsRepo = {
      create: vi.fn().mockImplementation((data: any) => ({ ...data, id: 't-mock' })),
      save: vi.fn().mockImplementation((data: any) => Promise.resolve(data)),
      find: vi.fn(),
      findOne: vi.fn(),
    };
    service = new TicketsService(ticketsRepo);
  });

  describe('emit', () => {
    it('debe emitir la cantidad solicitada de tickets con códigos únicos en estado ISSUED', async () => {
      const tickets = await service.emit('order-1', 'event-1', 'user-1', 3);

      expect(ticketsRepo.create).toHaveBeenCalledTimes(3);
      expect(ticketsRepo.save).toHaveBeenCalled();
      expect(tickets.length).toBe(3);
      tickets.forEach(ticket => {
        expect(ticket.status).toBe(TicketStatus.ISSUED);
        expect(ticket.code).toMatch(/^EVT-[A-F0-9]{16}$/);
      });
    });
  });

  describe('findById (Eje D: BOLA / IDOR)', () => {
    it('debe permitir consultar el ticket al usuario dueño', async () => {
      const ticket = new Ticket();
      ticket.id = 't-1';
      ticket.userId = 'user-owner';
      ticketsRepo.findOne.mockResolvedValue(ticket);

      const result = await service.findById('t-1', 'user-owner');
      expect(result).toBe(ticket);
    });

    it('debe rechazar con 403 Forbidden si otro usuario intenta ver el ticket (BOLA)', async () => {
      const ticket = new Ticket();
      ticket.id = 't-1';
      ticket.userId = 'user-owner';
      ticketsRepo.findOne.mockResolvedValue(ticket);

      await expect(service.findById('t-1', 'attacker-user')).rejects.toThrow(ForbiddenException);
    });

    it('debe permitir a staff y admin ver cualquier ticket', async () => {
      const ticket = new Ticket();
      ticket.id = 't-1';
      ticket.userId = 'user-owner';
      ticketsRepo.findOne.mockResolvedValue(ticket);

      const staffResult = await service.findById('t-1', 'staff-user', 'staff');
      expect(staffResult).toBe(ticket);

      const adminResult = await service.findById('t-1', 'admin-user', 'admin');
      expect(adminResult).toBe(ticket);
    });
  });

  describe('useTicket (Check-In & State Pattern)', () => {
    it('debe validar y marcar como USED una entrada emitida (ISSUED)', async () => {
      const ticket = new Ticket();
      ticket.id = 't-1';
      ticket.status = TicketStatus.ISSUED;
      ticketsRepo.findOne.mockResolvedValue(ticket);

      const result = await service.useTicket('t-1');

      expect(result.status).toBe(TicketStatus.USED);
      expect(result.scannedAt).toBeInstanceOf(Date);
      expect(ticketsRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: TicketStatus.USED }));
    });

    it('debe rechazar con 409 Conflict si la entrada ya fue utilizada (Prevención de doble uso)', async () => {
      const ticket = new Ticket();
      ticket.id = 't-1';
      ticket.status = TicketStatus.USED;
      ticketsRepo.findOne.mockResolvedValue(ticket);

      await expect(service.useTicket('t-1')).rejects.toThrow(ConflictException);
    });

    it('debe rechazar con 409 Conflict si la entrada está cancelada', async () => {
      const ticket = new Ticket();
      ticket.id = 't-1';
      ticket.status = TicketStatus.CANCELLED;
      ticketsRepo.findOne.mockResolvedValue(ticket);

      await expect(service.useTicket('t-1')).rejects.toThrow(ConflictException);
    });

    it('debe arrojar 404 NotFound si el ticket no existe', async () => {
      ticketsRepo.findOne.mockResolvedValue(null);

      await expect(service.useTicket('missing-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel y findByUserId', () => {
    it('debe cancelar una entrada emitida exitosamente', async () => {
      const ticket = new Ticket();
      ticket.id = 't-cancel';
      ticket.userId = 'u-1';
      ticket.status = TicketStatus.ISSUED;
      ticketsRepo.findOne.mockResolvedValue(ticket);

      const res = await service.cancel('t-cancel', 'u-1');
      expect(res.status).toBe(TicketStatus.CANCELLED);
    });

    it('debe rechazar cancelar una entrada ya utilizada con 409 Conflict', async () => {
      const ticket = new Ticket();
      ticket.id = 't-used';
      ticket.userId = 'u-1';
      ticket.status = TicketStatus.USED;
      ticketsRepo.findOne.mockResolvedValue(ticket);

      await expect(service.cancel('t-used', 'u-1')).rejects.toThrow(ConflictException);
    });

    it('debe listar todas las entradas de un usuario', async () => {
      const tickets = [new Ticket(), new Ticket()];
      ticketsRepo.find.mockResolvedValue(tickets);

      const res = await service.findByUserId('u-1');
      expect(res).toBe(tickets);
    });
  });
});

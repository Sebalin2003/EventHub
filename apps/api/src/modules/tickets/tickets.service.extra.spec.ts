import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { TicketsService } from './tickets.service.js';
import { Ticket, TicketStatus } from './entities/ticket.entity.js';

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return Object.assign(new Ticket(), {
    id: 't-1',
    userId: 'u-1',
    eventId: 'evt-1',
    orderId: 'ord-1',
    status: TicketStatus.ISSUED,
    ...overrides,
  });
}

describe('TicketsService - cobertura de estados y autorización (Eje B)', () => {
  let service: TicketsService;
  let repo: any;

  beforeEach(() => {
    repo = {
      create: vi.fn((data: any) => ({ ...data, id: 't-mock' })),
      save: vi.fn(async (data: any) => data),
      find: vi.fn(),
      findOne: vi.fn(),
    };
    service = new TicketsService(repo);
  });

  describe('emit y consultas', () => {
    it('emite tickets con el tipo de entrada informado', async () => {
      const tickets = await service.emit('ord-1', 'evt-1', 'u-1', 2, 'VIP');

      expect(tickets).toHaveLength(2);
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ ticketType: 'VIP', status: TicketStatus.ISSUED }));
    });

    it('emite cero tickets sin llamar a save con un arreglo vacío problemático', async () => {
      const tickets = await service.emit('ord-1', 'evt-1', 'u-1', 0);
      expect(tickets).toEqual([]);
      expect(repo.save).toHaveBeenCalledWith([]);
    });

    it('busca por id cuando el identificador es UUID', async () => {
      repo.findOne.mockResolvedValue(makeTicket());
      await service.findByIdOrCode('00000000-0000-0000-0000-000000000000');
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: '00000000-0000-0000-0000-000000000000' } });
    });

    it('busca por código cuando el identificador no es UUID', async () => {
      repo.findOne.mockResolvedValue(makeTicket());
      await service.findByIdOrCode('EVT-ABCDEF0123456789');
      expect(repo.findOne).toHaveBeenCalledWith({ where: { code: 'EVT-ABCDEF0123456789' } });
    });

    it('findById lanza 404 si el ticket no existe', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });

    it('findByOrder delega en el repositorio', async () => {
      const tickets = [makeTicket()];
      repo.find.mockResolvedValue(tickets);
      await expect(service.findByOrder('ord-1')).resolves.toBe(tickets);
      expect(repo.find).toHaveBeenCalledWith({ where: { orderId: 'ord-1' } });
    });
  });

  describe('cancel (autorización y estados)', () => {
    it('permite a un admin cancelar un ticket ajeno', async () => {
      repo.findOne.mockResolvedValue(makeTicket());
      const result = await service.cancel('t-1', { sub: 'admin', isAdmin: true });
      expect(result.status).toBe(TicketStatus.CANCELLED);
    });

    it('permite al dueño cancelar su ticket', async () => {
      repo.findOne.mockResolvedValue(makeTicket());
      const result = await service.cancel('t-1', { sub: 'u-1', isAdmin: false });
      expect(result.status).toBe(TicketStatus.CANCELLED);
    });

    it('rechaza a un actor objeto que no es dueño ni admin', async () => {
      repo.findOne.mockResolvedValue(makeTicket());
      await expect(service.cancel('t-1', { sub: 'attacker', isAdmin: false })).rejects.toThrow(ForbiddenException);
    });

    it('permite a un admin (string) cancelar un ticket ajeno', async () => {
      repo.findOne.mockResolvedValue(makeTicket());
      const result = await service.cancel('t-1', 'admin-user', 'admin');
      expect(result.status).toBe(TicketStatus.CANCELLED);
    });

    it('permite a staff (string) cancelar un ticket ajeno', async () => {
      repo.findOne.mockResolvedValue(makeTicket());
      const result = await service.cancel('t-1', 'staff-user', 'staff');
      expect(result.status).toBe(TicketStatus.CANCELLED);
    });

    it('rechaza a un usuario string que no es dueño', async () => {
      repo.findOne.mockResolvedValue(makeTicket());
      await expect(service.cancel('t-1', 'attacker', 'attendee')).rejects.toThrow(ForbiddenException);
    });

    it('permite al dueño (string) cancelar sin rol especial', async () => {
      repo.findOne.mockResolvedValue(makeTicket());
      const result = await service.cancel('t-1', 'u-1');
      expect(result.status).toBe(TicketStatus.CANCELLED);
    });

    it('rechaza cancelar un ticket escaneado con 409', async () => {
      repo.findOne.mockResolvedValue(makeTicket({ status: 'SCANNED' as any }));
      await expect(service.cancel('t-1', { sub: 'u-1', isAdmin: false })).rejects.toThrow(ConflictException);
    });

    it('lanza 404 si el ticket a cancelar no existe', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.cancel('missing', 'u-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('useTicket (estados)', () => {
    it('rechaza un ticket ya escaneado con 409', async () => {
      repo.findOne.mockResolvedValue(makeTicket({ status: 'SCANNED' as any }));
      await expect(service.useTicket('t-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('checkIn', () => {
    it('devuelve ENTRADA_INVALIDA si el ticket no existe', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.checkIn('missing')).resolves.toEqual({ result: 'ENTRADA_INVALIDA', ticket: null });
    });

    it('devuelve ENTRADA_INVALIDA si el ticket está cancelado', async () => {
      const ticket = makeTicket({ status: TicketStatus.CANCELLED });
      repo.findOne.mockResolvedValue(ticket);
      await expect(service.checkIn('t-1')).resolves.toEqual({ result: 'ENTRADA_INVALIDA', ticket });
    });

    it('devuelve ENTRADA_EVENTO_INCORRECTO si el evento no coincide', async () => {
      const ticket = makeTicket({ eventId: 'evt-1' });
      repo.findOne.mockResolvedValue(ticket);
      await expect(service.checkIn('t-1', 'evt-2')).resolves.toEqual({
        result: 'ENTRADA_EVENTO_INCORRECTO',
        ticket,
      });
    });

    it('devuelve ENTRADA_YA_UTILIZADA si el ticket está USED', async () => {
      const ticket = makeTicket({ status: TicketStatus.USED });
      repo.findOne.mockResolvedValue(ticket);
      await expect(service.checkIn('t-1')).resolves.toEqual({ result: 'ENTRADA_YA_UTILIZADA', ticket });
    });

    it('devuelve ENTRADA_YA_UTILIZADA si el ticket está SCANNED', async () => {
      const ticket = makeTicket({ status: 'SCANNED' as any });
      repo.findOne.mockResolvedValue(ticket);
      await expect(service.checkIn('t-1')).resolves.toEqual({ result: 'ENTRADA_YA_UTILIZADA', ticket });
    });

    it('valida el ingreso y persiste el estado SCANNED', async () => {
      const ticket = makeTicket();
      repo.findOne.mockResolvedValue(ticket);

      const result = await service.checkIn('t-1', 'evt-1');

      expect(result.result).toBe('ENTRADA_VALIDA');
      expect(result.ticket?.status).toBe('SCANNED');
      expect(result.ticket?.scannedAt).toBeInstanceOf(Date);
      expect(repo.save).toHaveBeenCalledWith(ticket);
    });
  });
});

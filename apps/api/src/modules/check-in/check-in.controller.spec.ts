import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CheckInController, ScanDto } from './check-in.controller.js';
import { UserRole } from '../identity/entities/user.entity.js';
import type { Ticket } from '../tickets/entities/ticket.entity.js';

describe('CheckInController (Eje B & Eje C: código HTTP del check-in)', () => {
  let controller: CheckInController;
  let tickets: { checkIn: ReturnType<typeof vi.fn> };
  let events: { findOne: ReturnType<typeof vi.fn> };

  const staff = { user: { sub: 'staff-1', role: UserRole.STAFF } };
  const organizer = { user: { sub: 'org-1', role: UserRole.ORGANIZER } };
  const scan = { eventId: 'e1' };

  beforeEach(() => {
    tickets = { checkIn: vi.fn() };
    events = { findOne: vi.fn(async () => ({ id: 'e-1', organizerId: 'org-1' })) };
    controller = new CheckInController(tickets as any, events as any);
  });

  it('devuelve 201 con el resultado cuando la entrada es válida', async () => {
    const ticket = { id: 't-1', code: 'EVT-ABC', eventId: 'e-1', scannedAt: new Date() } as Ticket;
    tickets.checkIn.mockResolvedValue({ result: 'ENTRADA_VALIDA', ticket });

    const response = await controller.scan('EVT-ABC', scan, staff);

    expect(response.success).toBe(true);
    expect(response.result).toBe('ENTRADA_VALIDA');
    expect(response.code).toBe('EVT-ABC');
    // Siempre se valida contra el id real del evento, no contra el legacyId enviado.
    expect(tickets.checkIn).toHaveBeenCalledWith('EVT-ABC', 'e-1');
  });

  it('responde 409 Conflict cuando la entrada ya fue utilizada (anti doble uso)', async () => {
    tickets.checkIn.mockResolvedValue({ result: 'ENTRADA_YA_UTILIZADA', ticket: { id: 't-1' } });

    const error = await controller.scan('EVT-ABC', scan, staff).catch(e => e);

    expect(error).toBeInstanceOf(ConflictException);
    expect(error.getStatus()).toBe(409);
  });

  it('responde 409 Conflict cuando la entrada pertenece a otro evento', async () => {
    events.findOne.mockResolvedValue({ id: 'e-2', organizerId: 'org-1' });
    tickets.checkIn.mockResolvedValue({ result: 'ENTRADA_EVENTO_INCORRECTO', ticket: { id: 't-1' } });

    const error = await controller.scan('EVT-ABC', { eventId: 'e-2' }, staff).catch(e => e);

    expect(error).toBeInstanceOf(ConflictException);
    expect(error.getStatus()).toBe(409);
  });

  it('responde 404 Not Found cuando la entrada no existe o está cancelada', async () => {
    tickets.checkIn.mockResolvedValue({ result: 'ENTRADA_INVALIDA', ticket: null });

    const error = await controller.scan('EVT-NOPE', scan, staff).catch(e => e);

    expect(error).toBeInstanceOf(NotFoundException);
    expect(error.getStatus()).toBe(404);
  });

  it('responde 403 si un organizador escanea una entrada de un evento ajeno', async () => {
    events.findOne.mockResolvedValue({ id: 'e-2', organizerId: 'otro-org' });

    const error = await controller.scan('EVT-ABC', { eventId: 'e-2' }, organizer).catch(e => e);

    expect(error).toBeInstanceOf(ForbiddenException);
    expect(tickets.checkIn).not.toHaveBeenCalled();
  });

  it('el evento es obligatorio: sin eventId el cuerpo no pasa la validación (400)', async () => {
    const errors = await validate(plainToInstance(ScanDto, {}));
    expect(errors.map(error => error.property)).toContain('eventId');
  });
});

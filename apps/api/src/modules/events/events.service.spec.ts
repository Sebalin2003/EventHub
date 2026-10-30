import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventsService } from './events.service.js';
import { Event, EventStatus } from './entities/event.entity.js';
import { ForbiddenException } from '@nestjs/common';

describe('EventsService (Eje A & Eje B: Gestión de Eventos y Notificaciones)', () => {
  let service: EventsService;
  let eventDaoMock: any;
  let eventFactoryMock: any;
  let clientMock: any;

  beforeEach(() => {
    eventDaoMock = {
      findAll: vi.fn(),
      findOne: vi.fn(),
      save: vi.fn(async (e: any) => ({ ...e, id: e.id || 'evt-mock' })),
      delete: vi.fn(),
      findByOrganizer: vi.fn(),
    };
    eventFactoryMock = {
      createEvent: vi.fn((data: any) => Object.assign(new Event(), data)),
    };
    clientMock = {
      emit: vi.fn(),
    };

    service = new EventsService(eventDaoMock, eventFactoryMock, clientMock);
  });

  it('debe listar todos los eventos disponibles', async () => {
    const events = [new Event(), new Event()];
    eventDaoMock.findAll.mockResolvedValue(events);

    const result = await service.findAll();
    expect(result).toBe(events);
    expect(eventDaoMock.findAll).toHaveBeenCalled();
  });

  it('debe crear un evento nuevo a través de la factoría', async () => {
    const data = { title: 'Lollapalooza 2026', capacity: 50000 };
    const result = await service.create(data);

    expect(eventFactoryMock.createEvent).toHaveBeenCalledWith(data);
    expect(eventDaoMock.save).toHaveBeenCalled();
    expect(result.id).toBe('evt-mock');
  });

  describe('publishOwned y cancelOwned con validación de organizador', () => {
    it('debe publicar el evento y emitir notificación a RabbitMQ si el organizador es el dueño', async () => {
      const event = new Event();
      event.id = 'evt-1';
      event.organizerId = 'org-1';
      event.status = EventStatus.DRAFT;
      event.title = 'Conferencia NestJS';

      eventDaoMock.findOne.mockResolvedValue(event);

      const published = await service.publishOwned('org-1', 'evt-1');

      expect(published.status).toBe(EventStatus.PUBLISHED);
      expect(clientMock.emit).toHaveBeenCalledWith('event.created', expect.objectContaining({
        eventId: 'evt-1',
        title: 'Conferencia NestJS',
      }));
    });

    it('debe rechazar con ForbiddenException si un organizador intenta modificar el evento de otro', async () => {
      const event = new Event();
      event.id = 'evt-1';
      event.organizerId = 'org-legitimo';

      eventDaoMock.findOne.mockResolvedValue(event);

      await expect(service.publishOwned('org-impostor', 'evt-1')).rejects.toThrow(ForbiddenException);
      expect(clientMock.emit).not.toHaveBeenCalled();
    });

    it('debe cancelar el evento si el organizador es legítimo', async () => {
      const event = new Event();
      event.id = 'evt-1';
      event.organizerId = 'org-1';
      event.status = EventStatus.PUBLISHED;

      eventDaoMock.findOne.mockResolvedValue(event);

      const cancelled = await service.cancelOwned('org-1', 'evt-1');
      expect(cancelled.status).toBe(EventStatus.CANCELLED);
    });
  });
});

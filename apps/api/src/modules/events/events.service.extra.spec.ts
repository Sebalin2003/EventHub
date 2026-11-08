import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventsService } from './events.service.js';
import { Event, EventStatus } from './entities/event.entity.js';
import { User, UserRole } from '../identity/entities/user.entity.js';

function makeEvent(overrides: Partial<Event> = {}): Event {
  return Object.assign(new Event(), {
    id: 'evt-1',
    legacyId: 'e1',
    title: 'Argentina Tech Summit',
    organizerId: 'org-1',
    status: EventStatus.DRAFT,
    date: new Date('2026-09-15T09:00:00.000Z'),
    endDate: new Date('2026-09-15T18:00:00.000Z'),
    location: 'CABA, Argentina',
    capacity: 100,
    registered: 0,
    ticketTypes: [],
    ...overrides,
  });
}

describe('EventsService - cobertura de gestión y geocodificación (Eje B)', () => {
  let service: EventsService;
  let eventDao: any;
  let eventFactory: any;
  let userRepo: any;
  let client: any;

  beforeEach(() => {
    eventDao = {
      findAll: vi.fn(),
      findVisible: vi.fn(),
      findOne: vi.fn(),
      save: vi.fn(async (event: Event) => event),
      delete: vi.fn(async () => undefined),
      findByOrganizer: vi.fn(),
    };
    eventFactory = {
      createEvent: vi.fn((data: Partial<Event>) => Object.assign(new Event(), data)),
    };
    userRepo = {
      findOne: vi.fn(async () => Object.assign(new User(), {
        id: 'org-1',
        email: 'org@eventhub.com',
        firstName: 'Río',
        lastName: 'Plata',
        role: UserRole.ORGANIZER,
      })),
    };
    client = { emit: vi.fn() };
    service = new EventsService(eventDao, eventFactory, userRepo, client);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('usa findVisible cuando el DAO lo soporta', async () => {
    const visible = [makeEvent()];
    eventDao.findVisible.mockResolvedValue(visible);

    await expect(service.findAll()).resolves.toBe(visible);
  });

  it('cae a findAll cuando el DAO no implementa findVisible', async () => {
    const fallbackDao: any = { findAll: vi.fn().mockResolvedValue([makeEvent()]) };
    const fallbackService = new EventsService(fallbackDao, eventFactory);

    await expect(fallbackService.findAll()).resolves.toHaveLength(1);
    expect(fallbackDao.findAll).toHaveBeenCalled();
  });

  it('considera al tercer argumento como cliente si expone emit (compatibilidad)', async () => {
    const legacyClient = { emit: vi.fn() };
    const legacyService = new EventsService(eventDao, eventFactory, legacyClient as any);
    const event = makeEvent({ ticketTypes: [{ id: 'tt-1', name: 'General', price: 1, totalQuantity: 1, sold: 0 }] as any });
    eventDao.findOne.mockResolvedValue(event);

    await legacyService.publishOwned('org-1', 'evt-1');

    expect(legacyClient.emit).toHaveBeenCalledWith('event.created', expect.objectContaining({ eventId: 'evt-1' }));
  });

  it('findOne devuelve eventos publicados y oculta los borradores', async () => {
    eventDao.findOne.mockResolvedValueOnce(makeEvent({ status: EventStatus.PUBLISHED }));
    await expect(service.findOne('evt-1')).resolves.toMatchObject({ id: 'evt-1' });

    eventDao.findOne.mockResolvedValueOnce(makeEvent({ status: EventStatus.DRAFT }));
    await expect(service.findOne('evt-1')).rejects.toThrow(NotFoundException);
  });

  it('create usa org-1 por defecto y persiste el evento', async () => {
    const result = await service.create({ title: 'Nuevo evento' } as any);

    expect(eventFactory.createEvent).toHaveBeenCalledWith(expect.objectContaining({ organizerId: 'org-1', status: EventStatus.DRAFT }));
    expect(result.title).toBe('Nuevo evento');
  });

  it('update aplica los cambios y guarda', async () => {
    const event = makeEvent();
    eventDao.findOne.mockResolvedValue(event);

    const result = await service.update('evt-1', { title: 'Renombrado' } as any);

    expect(result.title).toBe('Renombrado');
    expect(eventDao.save).toHaveBeenCalledWith(event);
  });

  it('remove elimina el evento por id interno', async () => {
    await service.remove('evt-1');
    expect(eventDao.delete).toHaveBeenCalledWith('evt-1');
  });

  it('listByOrganizer delega en el DAO', async () => {
    eventDao.findByOrganizer.mockResolvedValue([makeEvent()]);
    await expect(service.listByOrganizer('org-1')).resolves.toHaveLength(1);
  });

  describe('createForOrganizer', () => {
    it('rechaza un organizador inexistente con 400', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.createForOrganizer('nope', { title: 'X' } as any)).rejects.toThrow(BadRequestException);
    });

    it('rechaza un usuario que no es organizador con 400', async () => {
      userRepo.findOne.mockResolvedValue(Object.assign(new User(), { id: 'u1', role: UserRole.ATTENDEE }));
      await expect(service.createForOrganizer('u1', { title: 'X' } as any)).rejects.toThrow(BadRequestException);
    });

    it('usa el nombre real del organizador', async () => {
      const result = await service.createForOrganizer('org-1', { title: 'X' } as any);
      expect(result.organizerName).toBe('Río Plata');
      expect(result.status).toBe(EventStatus.DRAFT);
    });

    it('funciona sin repositorio de usuarios (modo unitario)', async () => {
      const noUsers = new EventsService(eventDao, eventFactory);
      const result = await noUsers.createForOrganizer('org-2', { title: 'X' } as any);
      expect(result.organizerName).toBe('Organizer');
    });
  });

  describe('updateOwned / publishOwned / cancelOwned', () => {
    it('updateOwned rechaza editar un evento cancelado con 409', async () => {
      eventDao.findOne.mockResolvedValue(makeEvent({ status: EventStatus.CANCELLED }));
      await expect(service.updateOwned('org-1', 'evt-1', {} as any)).rejects.toThrow(ConflictException);
    });

    it('updateOwned rechaza editar un evento completado con 409', async () => {
      eventDao.findOne.mockResolvedValue(makeEvent({ status: EventStatus.COMPLETED }));
      await expect(service.updateOwned('org-1', 'evt-1', {} as any)).rejects.toThrow(ConflictException);
    });

    it('updateOwned rechaza eventos de otro organizador con 403', async () => {
      eventDao.findOne.mockResolvedValue(makeEvent({ organizerId: 'org-other' }));
      await expect(service.updateOwned('org-1', 'evt-1', {} as any)).rejects.toThrow(ForbiddenException);
    });

    it('updateOwned actualiza un borrador propio', async () => {
      eventDao.findOne.mockResolvedValue(makeEvent());
      const result = await service.updateOwned('org-1', 'evt-1', { title: 'Actualizado' } as any);
      expect(result.title).toBe('Actualizado');
    });

    it('publishOwned rechaza eventos que no son borrador con 409', async () => {
      eventDao.findOne.mockResolvedValue(makeEvent({ status: EventStatus.PUBLISHED }));
      await expect(service.publishOwned('org-1', 'evt-1')).rejects.toThrow(ConflictException);
    });

    it('publishOwned rechaza eventos sin tipos de entrada con 400', async () => {
      eventDao.findOne.mockResolvedValue(makeEvent({ ticketTypes: [] }));
      await expect(service.publishOwned('org-1', 'evt-1')).rejects.toThrow(BadRequestException);
    });

    it('publishOwned emite event.created con el email del organizador', async () => {
      eventDao.findOne.mockResolvedValue(makeEvent({ ticketTypes: [{ id: 'tt-1', name: 'General', price: 1, totalQuantity: 2, sold: 0 }] as any }));

      const result = await service.publishOwned('org-1', 'evt-1');

      expect(result.status).toBe(EventStatus.PUBLISHED);
      expect(client.emit).toHaveBeenCalledWith('event.created', expect.objectContaining({
        organizerEmail: 'org@eventhub.com',
      }));
    });

    it('publishOwned funciona sin repositorio de usuarios ni broker', async () => {
      const bare = new EventsService(eventDao, eventFactory);
      eventDao.findOne.mockResolvedValue(makeEvent({ ticketTypes: [{ id: 'tt-1', name: 'General', price: 1, totalQuantity: 2, sold: 0 }] as any }));

      await expect(bare.publishOwned('org-1', 'evt-1')).resolves.toMatchObject({ status: EventStatus.PUBLISHED });
    });

    it('publishOwned funciona con repositorio de usuarios pero sin broker', async () => {
      const noBroker = new EventsService(eventDao, eventFactory, userRepo);
      eventDao.findOne.mockResolvedValue(makeEvent({ ticketTypes: [{ id: 'tt-1', name: 'General', price: 1, totalQuantity: 2, sold: 0 }] as any }));

      await expect(noBroker.publishOwned('org-1', 'evt-1')).resolves.toMatchObject({ status: EventStatus.PUBLISHED });
    });

    it('cancelOwned rechaza un evento ya cancelado con 409', async () => {
      eventDao.findOne.mockResolvedValue(makeEvent({ status: EventStatus.CANCELLED }));
      await expect(service.cancelOwned('org-1', 'evt-1')).rejects.toThrow(ConflictException);
    });

    it('cancelOwned rechaza un evento completado con 409', async () => {
      eventDao.findOne.mockResolvedValue(makeEvent({ status: EventStatus.COMPLETED }));
      await expect(service.cancelOwned('org-1', 'evt-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('registerSale', () => {
    it('incrementa vendidos y marca VENDIDO al alcanzar el cupo', async () => {
      const event = makeEvent({
        ticketTypes: [{ id: 'tt-1', name: 'General', price: 1, totalQuantity: 5, sold: 4, status: 'DISPONIBLE' }] as any,
      });
      eventDao.findOne.mockResolvedValue(event);

      const result = await service.registerSale('evt-1', 'tt-1', 1);

      expect(result.ticketTypes[0].sold).toBe(5);
      expect(result.ticketTypes[0].status).toBe('VENDIDO');
      expect(result.registered).toBe(1);
    });

    it('deja DISPONIBLE si todavía hay cupo', async () => {
      eventDao.findOne.mockResolvedValue(makeEvent({
        ticketTypes: [{ id: 'tt-1', name: 'General', price: 1, totalQuantity: 5, sold: 1, status: 'VENDIDO' }] as any,
      }));

      const result = await service.registerSale('evt-1', 'tt-1', 1);

      expect(result.ticketTypes[0].status).toBe('DISPONIBLE');
    });

    it('incrementa el contador general aunque el tipo no exista', async () => {
      eventDao.findOne.mockResolvedValue(makeEvent({ ticketTypes: [] }));

      const result = await service.registerSale('evt-1', 'missing', 2);

      expect(result.registered).toBe(2);
      expect(result.ticketTypes).toEqual([]);
    });
  });

  describe('applyData (vía update)', () => {
    it('rechaza endDate anterior a date con 400', async () => {
      eventDao.findOne.mockResolvedValue(makeEvent());
      await expect(service.update('evt-1', {
        date: '2026-09-20T00:00:00.000Z',
        endDate: '2026-09-19T00:00:00.000Z',
      } as any)).rejects.toThrow(BadRequestException);
    });

    it('calcula la duración a partir de las fechas', async () => {
      eventDao.findOne.mockResolvedValue(makeEvent());
      const result = await service.update('evt-1', {
        date: '2026-09-15T09:00:00.000Z',
        endDate: '2026-09-15T11:30:00.000Z',
      } as any);

      expect(result.duration).toBe(150);
    });

    it('usa 60 minutos por defecto si no hay endDate', async () => {
      eventDao.findOne.mockResolvedValue(makeEvent({ endDate: null as any, duration: 0 as any }));
      const result = await service.update('evt-1', { date: '2026-09-15T09:00:00.000Z' } as any);

      expect(result.duration).toBe(60);
    });

    it('conserva lo vendido al actualizar tipos de entrada', async () => {
      eventDao.findOne.mockResolvedValue(makeEvent({
        ticketTypes: [{ id: 'tt-1', name: 'General', price: 100, totalQuantity: 10, sold: 3, eventId: 'e1' }] as any,
      }));

      const result = await service.update('evt-1', {
        ticketTypes: [{ id: 'tt-1', name: 'General', price: 120, totalQuantity: 12 }],
      } as any);

      expect(result.ticketTypes[0]).toMatchObject({ sold: 3, price: 120, status: 'DISPONIBLE', eventId: 'e1' });
    });

    it('rechaza reducir el cupo por debajo de lo vendido con 400', async () => {
      eventDao.findOne.mockResolvedValue(makeEvent({
        ticketTypes: [{ id: 'tt-1', name: 'General', price: 100, totalQuantity: 10, sold: 3 }] as any,
      }));

      await expect(service.update('evt-1', {
        ticketTypes: [{ id: 'tt-1', name: 'General', price: 100, totalQuantity: 2 }],
      } as any)).rejects.toThrow(BadRequestException);
    });

    it('genera id y descripción por defecto en tipos nuevos', async () => {
      eventDao.findOne.mockResolvedValue(makeEvent({ ticketTypes: [] }));

      const result = await service.update('evt-1', {
        ticketTypes: [{ name: 'Nuevo', price: 10, totalQuantity: 3 }],
      } as any);

      expect(result.ticketTypes[0].id).toMatch(/^[0-9a-f-]{36}$/);
      expect(result.ticketTypes[0].description).toBe('Nuevo');
      expect(result.ticketTypes[0].status).toBe('DISPONIBLE');
    });

    it('marca VENDIDO cuando se crea un tipo sin cupo disponible', async () => {
      eventDao.findOne.mockResolvedValue(makeEvent({ ticketTypes: [] }));

      const result = await service.update('evt-1', {
        ticketTypes: [{ name: 'Agotado', price: 10, totalQuantity: 0 }],
      } as any);

      expect(result.ticketTypes[0].status).toBe('VENDIDO');
    });

    it('geocodifica cuando cambia la ubicación', async () => {
      eventDao.findOne.mockResolvedValue(makeEvent());
      vi.stubGlobal('fetch', vi.fn(async () => ({
        json: async () => [{ lat: '-34.60', lon: '-58.38' }],
      })));

      const result = await service.update('evt-1', { location: 'Buenos Aires' } as any);

      expect(result.lat).toBe(-34.6);
      expect(result.lon).toBe(-58.38);
    });

    it('deja coordenadas nulas si el geocoder no encuentra la dirección', async () => {
      eventDao.findOne.mockResolvedValue(makeEvent());
      vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => [] })));

      const result = await service.update('evt-1', { location: 'Lugar Inexistente' } as any);

      expect(result.lat).toBeNull();
      expect(result.lon).toBeNull();
    });

    it('tolera fallas del geocoder sin romper la actualización', async () => {
      eventDao.findOne.mockResolvedValue(makeEvent());
      vi.stubGlobal('fetch', vi.fn(async () => {
        throw new Error('network down');
      }));

      const result = await service.update('evt-1', { location: 'Otro Lugar' } as any);

      expect(result.lat).toBeNull();
      expect(result.lon).toBeNull();
    });

    it('no geocodifica si la ubicación no cambió', async () => {
      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);
      eventDao.findOne.mockResolvedValue(makeEvent({ location: 'CABA, Argentina' }));

      await service.update('evt-1', { location: 'CABA, Argentina' } as any);

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('asigna coordenadas nulas si se limpia la ubicación', async () => {
      eventDao.findOne.mockResolvedValue(makeEvent());
      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);

      const result = await service.update('evt-1', { location: null } as any);

      expect(result.lat).toBeNull();
      expect(result.lon).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });
});

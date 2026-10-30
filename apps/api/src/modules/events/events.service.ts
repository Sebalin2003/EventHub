import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { User, UserRole } from '../identity/entities/user.entity.js';
import { AdminCreateEventDto, CreateEventDto, TicketTypeDto, UpdateEventDto } from './dto/event.dto.js';
import { Event, EventStatus, EventTicketType } from './entities/event.entity.js';
import { EventDao } from './event.dao.js';
import { EventFactory } from './event.factory.js';

const GEOCODING_TIMEOUT_MS = 3000;

@Injectable()
export class EventsService implements OnModuleInit {
  private readonly logger = new Logger(EventsService.name);

  private readonly userRepository?: Repository<User>;
  private readonly client?: ClientProxy;

  constructor(
    private readonly eventDao: EventDao,
    private readonly eventFactory: EventFactory,
    @Optional() @InjectRepository(User) userRepository?: Repository<User>,
    @Optional() @Inject('NOTIFICATIONS_SERVICE') client?: ClientProxy,
  ) {
    if (userRepository && (userRepository as any).emit && !client) {
      this.client = userRepository as any;
      this.userRepository = undefined;
    } else {
      this.userRepository = userRepository;
      this.client = client;
    }
  }

  onModuleInit() {
    this.logger.log('Events service initialized');
  }

  findAll() {
    if (typeof this.eventDao.findVisible === 'function') {
      return this.eventDao.findVisible();
    }
    return (this.eventDao as any).findAll();
  }

  async findOne(id: string) {
    const event = await this.eventDao.findOne(id);
    if (event.status === EventStatus.DRAFT) throw new NotFoundException('Event not found');
    return event;
  }

  // Alta administrativa: el admin indica a qué organizador pertenece el evento.
  async create(data: AdminCreateEventDto) {
    const { organizerId = 'org-1', ...fields } = data;
    return this.createForOrganizer(organizerId, fields as any);
  }

  async update(id: string, data: UpdateEventDto) {
    const event = await this.eventDao.findOne(id);
    await this.applyData(event, data);
    return this.eventDao.save(event);
  }

  async remove(id: string) {
    await this.eventDao.delete(id);
  }

  listByOrganizer(organizerId: string) {
    return this.eventDao.findByOrganizer(organizerId);
  }

  async createForOrganizer(organizerId: string, data: CreateEventDto) {
    let organizerName = 'Organizer';
    if (this.userRepository) {
      const organizer = await this.userRepository.findOne({ where: { id: organizerId } });
      if (!organizer || organizer.role !== UserRole.ORGANIZER) {
        throw new BadRequestException('Organizer not found');
      }
      organizerName = `${organizer.firstName} ${organizer.lastName}`;
    }

    const event = this.eventFactory.createEvent({
      id: randomUUID(),
      organizerId,
      organizerName,
      status: EventStatus.DRAFT,
      registered: 0,
      featured: false,
      ticketTypes: [],
    });
    await this.applyData(event, data);
    return this.eventDao.save(event);
  }

  private async owned(eventId: string, organizerId: string): Promise<Event> {
    const event = await this.eventDao.findOne(eventId);
    if (event.organizerId !== organizerId) {
      throw new ForbiddenException('Not your event');
    }
    return event;
  }

  async updateOwned(organizerId: string, eventId: string, data: UpdateEventDto) {
    const event = await this.owned(eventId, organizerId);
    if (event.status === EventStatus.CANCELLED || event.status === EventStatus.COMPLETED) {
      throw new ConflictException(`Cannot edit a ${event.status} event`);
    }
    await this.applyData(event, data);
    return this.eventDao.save(event);
  }

  async publishOwned(organizerId: string, eventId: string) {
    const event = await this.owned(eventId, organizerId);
    if (event.status !== EventStatus.DRAFT) {
      throw new ConflictException(`Only draft events can be published (current: ${event.status})`);
    }
    if (!event.ticketTypes?.length) {
      throw new BadRequestException('An event needs at least one ticket type to be published');
    }
    event.status = EventStatus.PUBLISHED;
    const saved = await this.eventDao.save(event);

    const organizer = this.userRepository
      ? await this.userRepository.findOne({ where: { id: organizerId } })
      : null;

    if (this.client) {
      this.client.emit('event.created', {
        eventId: saved.id,
        title: saved.title,
        date: saved.date,
        organizerEmail: organizer?.email,
      });
    }

    return saved;
  }

  async cancelOwned(organizerId: string, eventId: string) {
    const event = await this.owned(eventId, organizerId);
    if (event.status === EventStatus.CANCELLED || event.status === EventStatus.COMPLETED) {
      throw new ConflictException(`Event is already ${event.status}`);
    }
    event.status = EventStatus.CANCELLED;
    return this.eventDao.save(event);
  }

  // Registra entradas vendidas en el tipo de entrada y en el contador del evento.
  async registerSale(eventId: string, ticketTypeId: string, quantity: number) {
    const event = await this.eventDao.findOne(eventId);
    const ticketType = event.ticketTypes.find(ticket => ticket.id === ticketTypeId);
    if (ticketType) {
      ticketType.sold += quantity;
      ticketType.status = ticketType.sold >= ticketType.totalQuantity ? 'VENDIDO' : 'DISPONIBLE';
      event.ticketTypes = [...event.ticketTypes];
    }
    event.registered += quantity;
    return this.eventDao.save(event);
  }

  private async applyData(event: Event, data: UpdateEventDto) {
    const { ticketTypes, ...rest } = data;
    // Los DTO transformados traen las propiedades no enviadas como undefined: no deben pisar datos.
    const fields = Object.fromEntries(Object.entries(rest).filter(([, value]) => value !== undefined)) as typeof rest;
    const locationChanged = fields.location !== undefined && fields.location !== event.location;
    Object.assign(event, fields);

    if (event.endDate && new Date(event.endDate).getTime() < new Date(event.date).getTime()) {
      throw new BadRequestException('endDate must be after date');
    }
    if (data.duration === undefined && (data.date !== undefined || data.endDate !== undefined || !event.duration)) {
      event.duration = this.durationFrom(event);
    }
    if (ticketTypes) event.ticketTypes = this.mergeTicketTypes(event, ticketTypes);
    if (locationChanged) Object.assign(event, await this.geocode(event.location));
  }

  private durationFrom(event: Event) {
    if (!event.endDate) return 60;
    const minutes = Math.round((new Date(event.endDate).getTime() - new Date(event.date).getTime()) / 60000);
    return Math.max(1, minutes);
  }

  // Conserva lo vendido de cada tipo existente: el cliente no puede modificar "sold".
  private mergeTicketTypes(event: Event, incoming: TicketTypeDto[]): EventTicketType[] {
    return incoming.map(ticket => {
      const existing = event.ticketTypes?.find(current => current.id === ticket.id);
      const sold = existing?.sold ?? 0;
      if (ticket.totalQuantity < sold) {
        throw new BadRequestException(`Ticket type "${ticket.name}" cannot have fewer tickets than already sold (${sold})`);
      }
      return {
        id: ticket.id ?? randomUUID(),
        eventId: event.legacyId ?? event.id,
        name: ticket.name,
        description: ticket.description ?? ticket.name,
        price: ticket.price,
        totalQuantity: ticket.totalQuantity,
        sold,
        status: sold >= ticket.totalQuantity ? 'VENDIDO' : 'DISPONIBLE',
      };
    });
  }

  private async geocode(location: string | null) {
    if (!location) return { lat: null, lon: null };
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(location)}`, {
        headers: { 'User-Agent': 'EventHub/1.0 (proyecto academico UADE)' },
        signal: AbortSignal.timeout(GEOCODING_TIMEOUT_MS),
      });
      const json = (await res.json()) as Array<{ lat: string; lon: string }>;
      if (json.length > 0) return { lat: parseFloat(json[0].lat), lon: parseFloat(json[0].lon) };
    } catch {
      this.logger.warn(`Geocoding failed for "${location}"`);
    }
    return { lat: null, lon: null };
  }
}

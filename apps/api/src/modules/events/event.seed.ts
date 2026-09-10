import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../identity/entities/user.entity.js';
import { ScryptHashStrategy } from '../identity/strategies/scrypt-hash.strategy.js';
import { Event, EventModality, EventStatus } from './entities/event.entity.js';

const events = [
  ['e1', 'Argentina Tech Summit 2026', 'Tres jornadas sobre inteligencia artificial, ciberseguridad, fintech y producto digital.', 'conferencia', 'presencial', '2026-09-15T09:00:00.000Z', '2026-09-17T18:00:00.000Z', 'Centro de Convenciones Buenos Aires', 'Av. Pres. Figueroa Alcorta 2099', 'CABA', 1200, 876, true, 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&h=500&fit=crop&auto=format', [['tt1a', 'General', 85000, 800, 620], ['tt1b', 'VIP', 175000, 300, 210], ['tt1c', 'Premium', 260000, 100, 46]]],
  ['e2', 'Workshop de Arquitectura de Software', 'Taller intensivo sobre sistemas distribuidos, observabilidad y decisiones de arquitectura.', 'taller', 'presencial', '2026-09-19T10:00:00.000Z', '2026-09-19T18:00:00.000Z', 'Centro Cultural Córdoba', 'Av. Poeta Lugones 401', 'Córdoba', 60, 48, false, 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=900&h=500&fit=crop&auto=format', [['tt2a', 'Profesional', 62000, 45, 36], ['tt2b', 'Estudiante', 35000, 15, 12]]],
  ['e3', 'After Office Emprendedor Rosario', 'Encuentro abierto para fundadores y equipos del ecosistema emprendedor del Litoral.', 'networking', 'presencial', '2026-09-24T19:00:00.000Z', '2026-09-24T22:00:00.000Z', 'Galpón 11', 'Estévez Boero 980', 'Rosario', 220, 151, false, 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=900&h=500&fit=crop&auto=format', [['tt3a', 'Acceso general', 0, 220, 151]]],
  ['e4', 'Marketing con IA para PyMEs', 'Webinar práctico para incorporar inteligencia artificial en contenidos y atención al cliente.', 'webinar', 'online', '2026-09-29T18:30:00.000Z', '2026-09-29T20:00:00.000Z', 'Transmisión online', '', 'Online', 800, 460, false, 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=900&h=500&fit=crop&auto=format', [['tt4a', 'Acceso online', 12000, 800, 460]]],
  ['e5', 'Festival Río Sonoro', 'Tres jornadas de rock, indie y música urbana argentina con dos escenarios.', 'concierto', 'presencial', '2026-10-03T14:00:00.000Z', '2026-10-05T23:30:00.000Z', 'Parque de la Costa Cultural', 'Vivanco 1509', 'Tigre', 9000, 5740, true, 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&h=500&fit=crop&auto=format', [['tt5a', 'Pase diario', 55000, 3500, 2320], ['tt5b', 'Abono 3 jornadas', 135000, 4500, 3040], ['tt5c', 'Campo preferencial', 240000, 1000, 380]]],
  ['e6', 'Mendoza Arte Contemporáneo', 'Muestra federal de pintura, fotografía, instalación y arte digital.', 'exposicion', 'presencial', '2026-10-08T11:00:00.000Z', '2026-10-18T20:00:00.000Z', 'Espacio Cultural Julio Le Parc', 'Mitre y Godoy Cruz', 'Guaymallén, Mendoza', 650, 310, false, 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=900&h=500&fit=crop&auto=format', [['tt6a', 'Entrada general', 18000, 600, 285], ['tt6b', 'Estudiantes y jubilados', 9000, 50, 25]]],
  ['e7', 'Finanzas Personales sin Vueltas', 'Conferencia sobre presupuesto, inflación e inversiones para la vida cotidiana.', 'conferencia', 'hibrido', '2026-10-10T10:00:00.000Z', '2026-10-10T13:30:00.000Z', 'Usina del Arte', 'Agustín R. Caffarena 1', 'CABA', 500, 322, false, 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&h=500&fit=crop&auto=format', [['tt7a', 'Presencial', 32000, 300, 214], ['tt7b', 'Streaming', 15000, 200, 108]]],
  ['e8', 'Noche de Folklore en Salta', 'Una noche con referentes del folklore del NOA y artistas jóvenes de la región.', 'concierto', 'presencial', '2026-10-12T21:00:00.000Z', '2026-10-13T00:30:00.000Z', 'Teatro Provincial Juan Carlos Saravia', 'Zuviría 70', 'Salta', 1500, 1090, true, 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=900&h=500&fit=crop&auto=format', [['tt8a', 'Platea', 48000, 900, 690], ['tt8b', 'Pullman', 32000, 600, 400]]],
  ['e9', 'Diseño UX para Productos Reales', 'Jornada de investigación, prototipado y pruebas de usabilidad.', 'taller', 'presencial', '2026-10-17T09:30:00.000Z', '2026-10-17T17:30:00.000Z', 'Distrito Tecnológico', 'Uspallata 3160', 'CABA', 80, 61, false, 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=900&h=500&fit=crop&auto=format', [['tt9a', 'General', 68000, 60, 49], ['tt9b', 'Comunidad', 42000, 20, 12]]],
  ['e10', 'Expo Vinos de Altura', 'Degustación guiada de bodegas de distintas regiones argentinas.', 'exposicion', 'presencial', '2026-10-22T18:00:00.000Z', '2026-10-22T23:00:00.000Z', 'Nave Cultural', 'Av. España y Maza', 'Mendoza', 700, 515, false, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&h=500&fit=crop&auto=format', [['tt10a', 'Degustación', 45000, 600, 455], ['tt10b', 'Experiencia premium', 98000, 100, 60]]],
  ['e11', 'Patagonia Data Day', 'Charlas y casos de datos, analítica e inteligencia artificial.', 'conferencia', 'hibrido', '2026-10-27T09:00:00.000Z', '2026-10-27T18:00:00.000Z', 'MNBA Neuquén', 'Mitre y Santa Cruz', 'Neuquén', 420, 280, false, 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&h=500&fit=crop&auto=format', [['tt11a', 'Presencial', 52000, 300, 216], ['tt11b', 'Online', 22000, 120, 64]]],
  ['e12', 'Encuentro de Turismo Sustentable', 'Experiencias y herramientas para reducir el impacto ambiental.', 'networking', 'presencial', '2026-10-30T15:00:00.000Z', '2026-10-30T20:00:00.000Z', 'Centro Cívico Bariloche', 'Libertad 51', 'San Carlos de Bariloche', 260, 172, false, 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=900&h=500&fit=crop&auto=format', [['tt12a', 'Profesionales', 28000, 210, 140], ['tt12b', 'Estudiantes', 12000, 50, 32]]],
  ['e13', 'Ciclo de Jazz en La Plata', 'Cuatro ensambles argentinos presentan repertorio propio.', 'concierto', 'presencial', '2026-11-05T20:30:00.000Z', '2026-11-05T23:45:00.000Z', 'Teatro Argentino de La Plata', 'Av. 51 entre 9 y 10', 'La Plata', 950, 620, false, 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&h=500&fit=crop&auto=format', [['tt13a', 'Platea', 42000, 600, 420], ['tt13b', 'Bandeja', 30000, 350, 200]]],
  ['e14', 'Introducción a la Impresión 3D', 'Taller de modelado básico y operación segura de impresoras.', 'taller', 'presencial', '2026-11-07T10:00:00.000Z', '2026-11-07T16:00:00.000Z', 'Polo Científico Tecnológico', 'Godoy Cruz 2270', 'CABA', 36, 27, false, 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=900&h=500&fit=crop&auto=format', [['tt14a', 'Cupo individual', 56000, 36, 27]]],
  ['e15', 'E-commerce para Emprendimientos', 'Claves para catálogo, logística, pagos y campañas digitales.', 'webinar', 'online', '2026-11-12T19:00:00.000Z', '2026-11-12T21:00:00.000Z', 'Transmisión online', '', 'Online', 1000, 590, false, 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=900&h=500&fit=crop&auto=format', [['tt15a', 'Acceso online', 14000, 1000, 590]]],
  ['e16', 'Feria Federal del Libro Independiente', 'Editoriales y autores independientes se reúnen con charlas y lecturas.', 'exposicion', 'presencial', '2026-11-14T12:00:00.000Z', '2026-11-16T20:00:00.000Z', 'Centro Cultural Kirchner', 'Sarmiento 151', 'CABA', 3500, 1680, true, 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=900&h=500&fit=crop&auto=format', [['tt16a', 'Entrada gratuita', 0, 3500, 1680]]],
  ['e17', 'San Juan Minería e Innovación', 'Tecnología, seguridad y desarrollo sostenible para la actividad minera.', 'conferencia', 'presencial', '2026-11-19T08:30:00.000Z', '2026-11-20T17:30:00.000Z', 'Centro de Convenciones Guillermo Barrena Guzmán', 'Las Heras Norte 101', 'San Juan', 850, 502, false, 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&h=500&fit=crop&auto=format', [['tt17a', 'Profesional', 98000, 700, 430], ['tt17b', 'Estudiante', 28000, 150, 72]]],
  ['e18', 'Ushuaia Ambient Music Session', 'Música electrónica ambiental y visuales inmersivas.', 'concierto', 'presencial', '2026-11-21T20:00:00.000Z', '2026-11-21T23:30:00.000Z', 'Casa de la Cultura Ushuaia', 'Malvinas Argentinas 1850', 'Ushuaia', 500, 366, false, 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=900&h=500&fit=crop&auto=format', [['tt18a', 'General', 38000, 420, 312], ['tt18b', 'Preferencial', 62000, 80, 54]]],
  ['e19', 'Mar del Plata Gastronómica', 'Cocineros y productores presentan sabores del Atlántico.', 'exposicion', 'presencial', '2026-11-27T12:00:00.000Z', '2026-11-29T22:00:00.000Z', 'NH Gran Hotel Provincial', 'Patricio Peralta Ramos 2502', 'Mar del Plata', 2200, 1340, false, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&h=500&fit=crop&auto=format', [['tt19a', 'Pase diario', 25000, 1800, 1100], ['tt19b', 'Pase con degustación', 48000, 400, 240]]],
  ['e20', 'Comunidad Dev: Cierre de Año', 'Charlas relámpago y networking para desarrolladores y equipos de producto.', 'networking', 'presencial', '2026-12-04T18:30:00.000Z', '2026-12-04T22:30:00.000Z', 'Complejo Art Media', 'Av. Corrientes 6271', 'CABA', 1000, 720, false, 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=900&h=500&fit=crop&auto=format', [['tt20a', 'Comunidad', 18000, 850, 620], ['tt20b', 'Sponsor lounge', 65000, 150, 100]]],
] as const;

const users = [
  ['maria@eventhub.com.ar', 'María', 'González', UserRole.ATTENDEE],
  ['javier@eventhub.com.ar', 'Javier', 'Romero', UserRole.ATTENDEE],
  ['eventos@eventhub.com.ar', 'Río Plata', 'Producciones', UserRole.ORGANIZER],
  ['hola@comunidaddigital.ar', 'Comunidad Digital', 'Argentina', UserRole.ORGANIZER],
  ['staff@eventhub.com.ar', 'Carlos', 'Staff', UserRole.STAFF],
  ['admin@eventhub.com.ar', 'Admin', 'Sistema', UserRole.ADMIN],
  ['lucia@email.com.ar', 'Lucía', 'Fernández', UserRole.ATTENDEE],
  ['marcos@email.com.ar', 'Marcos', 'Díaz', UserRole.ATTENDEE],
] as const;

@Injectable()
export class EventSeed implements OnModuleInit {
  private readonly hash = new ScryptHashStrategy();

  constructor(
    @InjectRepository(Event) private readonly eventRepository: Repository<Event>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    for (const [email, firstName, lastName, role] of users) {
      const existing = await this.userRepository.findOne({ where: { email } });
      if (!existing) {
        await this.userRepository.save({
          email,
          passwordHash: this.hash.hashPassword('password'),
          firstName,
          lastName,
          role,
        });
      }
    }

    const organizer = await this.userRepository.findOneOrFail({ where: { email: 'eventos@eventhub.com.ar' } });

    for (const [legacyId, title, description, category, modality, date, endDate, venue, location, city, capacity, registered, featured, imageUrl, ticketTypes] of events) {
      const exists = await this.eventRepository.findOne({ where: { legacyId } });
      if (exists) continue;
      await this.eventRepository.save({
        legacyId,
        title,
        description,
        category,
        modality: modality === 'online' ? EventModality.ONLINE : EventModality.IN_PERSON,
        date: new Date(date),
        endDate: new Date(endDate),
        duration: Math.max(1, (new Date(endDate).getTime() - new Date(date).getTime()) / 60000),
        venue,
        location: `${location}${city ? `, ${city}` : ''}`,
        capacity,
        registered,
        featured,
        imageUrl,
        organizerId: organizer.id,
        organizerName: `${organizer.firstName} ${organizer.lastName}`,
        status: EventStatus.PUBLISHED,
        ticketTypes: ticketTypes.map(([id, name, price, totalQuantity, sold]) => ({ id, eventId: legacyId, name, description: name, price, totalQuantity, sold, status: sold >= totalQuantity ? 'VENDIDO' : 'DISPONIBLE' })),
      });
    }
  }
}

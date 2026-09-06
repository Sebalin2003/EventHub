import type { CheckInRecord, Event, EventCategory, EventModality, Order, TicketType, UserProfile } from '../types'

export const seedUsers: UserProfile[] = [
  { id: 'u1', name: 'María González', email: 'maria@eventhub.com.ar', role: 'ASISTENTE', phone: '+54 9 11 6123 1122', joinedAt: '2025-03-10', active: true },
  { id: 'u2', name: 'Javier Romero', email: 'javier@eventhub.com.ar', role: 'ASISTENTE', phone: '+54 9 11 6553 3344', joinedAt: '2025-05-20', active: true },
  { id: 'u3', name: 'Río Plata Producciones', email: 'eventos@rioplata.com.ar', role: 'ORGANIZADOR', phone: '+54 11 4312 1234', joinedAt: '2024-11-01', active: true },
  { id: 'u4', name: 'Comunidad Digital Argentina', email: 'hola@comunidaddigital.ar', role: 'ORGANIZADOR', phone: '+54 11 4788 5678', joinedAt: '2025-01-15', active: true },
  { id: 'u5', name: 'Carlos Staff', email: 'staff@eventhub.com.ar', role: 'STAFF', phone: '+54 9 11 6119 9000', joinedAt: '2025-06-01', active: true },
  { id: 'u6', name: 'Admin Sistema', email: 'admin@eventhub.com.ar', role: 'ADMIN', phone: '+54 11 0800 100 200', joinedAt: '2024-01-01', active: true },
  { id: 'u7', name: 'Lucía Fernández', email: 'lucia@email.com.ar', role: 'ASISTENTE', phone: '+54 9 351 6337 7888', joinedAt: '2025-07-10', active: true },
  { id: 'u8', name: 'Marcos Díaz', email: 'marcos@email.com.ar', role: 'ASISTENTE', phone: '+54 9 261 6445 5666', joinedAt: '2025-08-01', active: false },
]

type EventInput = {
  id: string; title: string; description: string; category: EventCategory; modality: EventModality
  date: string; endDate: string; venueName: string; address: string; city: string
  capacity: number; registered: number; organizerId?: 'u3' | 'u4'; featured?: boolean; imageUrl: string
  tickets: Array<[name: string, description: string, price: number, quantity: number, sold: number]>
  cancellationPolicy?: string; maxTicketsPerUser?: number
}

function makeEvent(input: EventInput): Event {
  const organizerId = input.organizerId ?? 'u3'
  const ticketTypes: TicketType[] = input.tickets.map(([name, description, price, totalQuantity, sold], index) => ({
    id: `tt${input.id.slice(1)}${String.fromCharCode(97 + index)}`,
    eventId: input.id,
    name,
    description,
    price,
    totalQuantity,
    sold,
    status: sold >= totalQuantity ? 'VENDIDO' : 'DISPONIBLE',
  }))
  return {
    ...input,
    status: 'publicado',
    organizerId,
    organizerName: organizerId === 'u3' ? 'Río Plata Producciones' : 'Comunidad Digital Argentina',
    ticketTypes,
    saleCutoffDate: input.date.slice(0, 10),
    maxTicketsPerUser: input.maxTicketsPerUser ?? 4,
    cancellationPolicy: input.cancellationPolicy ?? 'Reembolso completo hasta 7 días antes del evento.',
    featured: input.featured ?? false,
    checkIns: 0,
  }
}

const images = {
  conference: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&h=500&fit=crop&auto=format',
  workshop: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=900&h=500&fit=crop&auto=format',
  people: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=900&h=500&fit=crop&auto=format',
  webinar: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=900&h=500&fit=crop&auto=format',
  music: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&h=500&fit=crop&auto=format',
  art: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=900&h=500&fit=crop&auto=format',
  stage: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=900&h=500&fit=crop&auto=format',
  food: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&h=500&fit=crop&auto=format',
}

export const seedEvents: Event[] = [
  makeEvent({ id: 'e1', title: 'Argentina Tech Summit 2026', description: 'Tres jornadas sobre inteligencia artificial, ciberseguridad, fintech y producto digital con referentes de empresas y universidades argentinas.', category: 'conferencia', modality: 'presencial', date: '2026-09-15T09:00', endDate: '2026-09-17T18:00', venueName: 'Centro de Convenciones Buenos Aires', address: 'Av. Pres. Figueroa Alcorta 2099', city: 'CABA', capacity: 1200, registered: 876, featured: true, imageUrl: images.conference, tickets: [['General', 'Acceso a las conferencias principales', 85000, 800, 620], ['VIP', 'Ingreso prioritario y espacio de networking', 175000, 300, 210], ['Premium', 'VIP, cena de cierre y encuentro con speakers', 260000, 100, 46]] }),
  makeEvent({ id: 'e2', title: 'Workshop de Arquitectura de Software', description: 'Taller intensivo sobre sistemas distribuidos, observabilidad y decisiones de arquitectura con ejercicios basados en casos reales.', category: 'taller', modality: 'presencial', date: '2026-09-19T10:00', endDate: '2026-09-19T18:00', venueName: 'Centro Cultural Córdoba', address: 'Av. Poeta Lugones 401', city: 'Córdoba', capacity: 60, registered: 48, organizerId: 'u4', imageUrl: images.workshop, tickets: [['Profesional', 'Taller y materiales digitales', 62000, 45, 36], ['Estudiante', 'Cupo con certificado universitario', 35000, 15, 12]] }),
  makeEvent({ id: 'e3', title: 'After Office Emprendedor Rosario', description: 'Encuentro abierto para fundadores, equipos y personas que están dando sus primeros pasos en el ecosistema emprendedor del Litoral.', category: 'networking', modality: 'presencial', date: '2026-09-24T19:00', endDate: '2026-09-24T22:00', venueName: 'Galpón 11', address: 'Estévez Boero 980', city: 'Rosario', capacity: 220, registered: 151, imageUrl: images.people, tickets: [['Acceso general', 'Entrada con acreditación previa', 0, 220, 151]] }),
  makeEvent({ id: 'e4', title: 'Marketing con IA para PyMEs', description: 'Webinar práctico para incorporar inteligencia artificial en contenidos, atención al cliente y análisis comercial sin grandes presupuestos.', category: 'webinar', modality: 'online', date: '2026-09-29T18:30', endDate: '2026-09-29T20:00', venueName: 'Transmisión online', address: '', city: 'Online', capacity: 800, registered: 460, organizerId: 'u4', imageUrl: images.webinar, tickets: [['Acceso online', 'Vivo y grabación durante 30 días', 12000, 800, 460]] }),
  makeEvent({ id: 'e5', title: 'Festival Río Sonoro', description: 'Tres jornadas de rock, indie y música urbana argentina con dos escenarios, gastronomía regional y actividades al aire libre.', category: 'concierto', modality: 'presencial', date: '2026-10-03T14:00', endDate: '2026-10-05T23:30', venueName: 'Parque de la Costa Cultural', address: 'Vivanco 1509', city: 'Tigre', capacity: 9000, registered: 5740, featured: true, imageUrl: images.music, tickets: [['Pase diario', 'Acceso a una jornada', 55000, 3500, 2320], ['Abono 3 jornadas', 'Acceso completo al festival', 135000, 4500, 3040], ['Campo preferencial', 'Sector cercano al escenario principal', 240000, 1000, 380]], maxTicketsPerUser: 6, cancellationPolicy: 'Reembolso del 80% hasta 15 días antes del festival.' }),
  makeEvent({ id: 'e6', title: 'Mendoza Arte Contemporáneo', description: 'Muestra federal de pintura, fotografía, instalación y arte digital con artistas emergentes de todo el país.', category: 'exposicion', modality: 'presencial', date: '2026-10-08T11:00', endDate: '2026-10-18T20:00', venueName: 'Espacio Cultural Julio Le Parc', address: 'Mitre y Godoy Cruz', city: 'Guaymallén, Mendoza', capacity: 650, registered: 310, imageUrl: images.art, tickets: [['Entrada general', 'Acceso durante una jornada', 18000, 600, 285], ['Estudiantes y jubilados', 'Presentar acreditación', 9000, 50, 25]] }),
  makeEvent({ id: 'e7', title: 'Finanzas Personales sin Vueltas', description: 'Una conferencia clara sobre presupuesto, inflación, inversiones reguladas y planificación financiera para la vida cotidiana.', category: 'conferencia', modality: 'hibrido', date: '2026-10-10T10:00', endDate: '2026-10-10T13:30', venueName: 'Usina del Arte', address: 'Agustín R. Caffarena 1', city: 'CABA', capacity: 500, registered: 322, organizerId: 'u4', imageUrl: images.conference, tickets: [['Presencial', 'Acceso a sala y material', 32000, 300, 214], ['Streaming', 'Transmisión en vivo', 15000, 200, 108]] }),
  makeEvent({ id: 'e8', title: 'Noche de Folklore en Salta', description: 'Una noche con referentes del folklore del NOA, ballet invitado y una selección de artistas jóvenes de la región.', category: 'concierto', modality: 'presencial', date: '2026-10-12T21:00', endDate: '2026-10-13T00:30', venueName: 'Teatro Provincial Juan Carlos Saravia', address: 'Zuviría 70', city: 'Salta', capacity: 1500, registered: 1090, featured: true, imageUrl: images.stage, tickets: [['Platea', 'Ubicación numerada en platea', 48000, 900, 690], ['Pullman', 'Ubicación numerada en nivel superior', 32000, 600, 400]] }),
  makeEvent({ id: 'e9', title: 'Diseño UX para Productos Reales', description: 'Jornada de investigación, prototipado y pruebas de usabilidad orientada a equipos que construyen productos digitales.', category: 'taller', modality: 'presencial', date: '2026-10-17T09:30', endDate: '2026-10-17T17:30', venueName: 'Distrito Tecnológico', address: 'Uspallata 3160', city: 'CABA', capacity: 80, registered: 61, organizerId: 'u4', imageUrl: images.workshop, tickets: [['General', 'Taller, almuerzo y materiales', 68000, 60, 49], ['Comunidad', 'Precio para estudiantes y ONG', 42000, 20, 12]] }),
  makeEvent({ id: 'e10', title: 'Expo Vinos de Altura', description: 'Degustación guiada de bodegas de Mendoza, Salta, San Juan y Patagonia junto a productores y sommeliers.', category: 'exposicion', modality: 'presencial', date: '2026-10-22T18:00', endDate: '2026-10-22T23:00', venueName: 'Nave Cultural', address: 'Av. España y Maza', city: 'Mendoza', capacity: 700, registered: 515, imageUrl: images.food, tickets: [['Degustación', 'Copa y degustaciones seleccionadas', 45000, 600, 455], ['Experiencia premium', 'Cata privada y maridaje', 98000, 100, 60]] }),
  makeEvent({ id: 'e11', title: 'Patagonia Data Day', description: 'Charlas y casos de datos, analítica e inteligencia artificial desarrollados por equipos de la Patagonia.', category: 'conferencia', modality: 'hibrido', date: '2026-10-27T09:00', endDate: '2026-10-27T18:00', venueName: 'MNBA Neuquén', address: 'Mitre y Santa Cruz', city: 'Neuquén', capacity: 420, registered: 280, organizerId: 'u4', imageUrl: images.conference, tickets: [['Presencial', 'Jornada completa y coffee break', 52000, 300, 216], ['Online', 'Streaming y grabaciones', 22000, 120, 64]] }),
  makeEvent({ id: 'e12', title: 'Encuentro de Turismo Sustentable', description: 'Experiencias y herramientas para destinos, alojamientos y prestadores que buscan reducir su impacto ambiental.', category: 'networking', modality: 'presencial', date: '2026-10-30T15:00', endDate: '2026-10-30T20:00', venueName: 'Centro Cívico Bariloche', address: 'Libertad 51', city: 'San Carlos de Bariloche', capacity: 260, registered: 172, imageUrl: images.people, tickets: [['Profesionales', 'Conferencias y ronda de contactos', 28000, 210, 140], ['Estudiantes', 'Acceso con libreta universitaria', 12000, 50, 32]] }),
  makeEvent({ id: 'e13', title: 'Ciclo de Jazz en La Plata', description: 'Cuatro ensambles argentinos presentan repertorio propio en una noche dedicada a la escena independiente.', category: 'concierto', modality: 'presencial', date: '2026-11-05T20:30', endDate: '2026-11-05T23:45', venueName: 'Teatro Argentino de La Plata', address: 'Av. 51 entre 9 y 10', city: 'La Plata', capacity: 950, registered: 620, imageUrl: images.music, tickets: [['Platea', 'Ubicación numerada', 42000, 600, 420], ['Bandeja', 'Ubicación numerada', 30000, 350, 200]] }),
  makeEvent({ id: 'e14', title: 'Introducción a la Impresión 3D', description: 'Taller para aprender modelado básico, preparación de archivos y operación segura de impresoras de filamento.', category: 'taller', modality: 'presencial', date: '2026-11-07T10:00', endDate: '2026-11-07T16:00', venueName: 'Polo Científico Tecnológico', address: 'Godoy Cruz 2270', city: 'CABA', capacity: 36, registered: 27, organizerId: 'u4', imageUrl: images.workshop, tickets: [['Cupo individual', 'Equipo y materiales incluidos', 56000, 36, 27]] }),
  makeEvent({ id: 'e15', title: 'E-commerce para Emprendimientos', description: 'Claves para catálogo, logística, pagos, atención y campañas digitales pensadas para negocios argentinos.', category: 'webinar', modality: 'online', date: '2026-11-12T19:00', endDate: '2026-11-12T21:00', venueName: 'Transmisión online', address: '', city: 'Online', capacity: 1000, registered: 590, organizerId: 'u4', imageUrl: images.webinar, tickets: [['Acceso online', 'Vivo, plantilla y grabación', 14000, 1000, 590]] }),
  makeEvent({ id: 'e16', title: 'Feria Federal del Libro Independiente', description: 'Editoriales, autores y librerías independientes de todas las regiones se reúnen con charlas y lecturas abiertas.', category: 'exposicion', modality: 'presencial', date: '2026-11-14T12:00', endDate: '2026-11-16T20:00', venueName: 'Centro Cultural Kirchner', address: 'Sarmiento 151', city: 'CABA', capacity: 3500, registered: 1680, featured: true, imageUrl: images.art, tickets: [['Entrada gratuita', 'Ingreso con reserva por franja horaria', 0, 3500, 1680]] }),
  makeEvent({ id: 'e17', title: 'San Juan Minería e Innovación', description: 'Proveedores, universidades y especialistas analizan tecnología, seguridad y desarrollo sostenible para la actividad minera.', category: 'conferencia', modality: 'presencial', date: '2026-11-19T08:30', endDate: '2026-11-20T17:30', venueName: 'Centro de Convenciones Guillermo Barrena Guzmán', address: 'Las Heras Norte 101', city: 'San Juan', capacity: 850, registered: 502, imageUrl: images.conference, tickets: [['Profesional', 'Dos jornadas y acreditación', 98000, 700, 430], ['Estudiante', 'Acceso con acreditación académica', 28000, 150, 72]] }),
  makeEvent({ id: 'e18', title: 'Ushuaia Ambient Music Session', description: 'Música electrónica ambiental y visuales inmersivas inspiradas en los paisajes de Tierra del Fuego.', category: 'concierto', modality: 'presencial', date: '2026-11-21T20:00', endDate: '2026-11-21T23:30', venueName: 'Casa de la Cultura Ushuaia', address: 'Malvinas Argentinas 1850', city: 'Ushuaia', capacity: 500, registered: 366, imageUrl: images.stage, tickets: [['General', 'Acceso al espectáculo', 38000, 420, 312], ['Preferencial', 'Sector central y acceso anticipado', 62000, 80, 54]] }),
  makeEvent({ id: 'e19', title: 'Mar del Plata Gastronómica', description: 'Cocineros, productores y emprendimientos locales presentan sabores del Atlántico, demostraciones y clases breves.', category: 'exposicion', modality: 'presencial', date: '2026-11-27T12:00', endDate: '2026-11-29T22:00', venueName: 'NH Gran Hotel Provincial', address: 'Patricio Peralta Ramos 2502', city: 'Mar del Plata', capacity: 2200, registered: 1340, imageUrl: images.food, tickets: [['Pase diario', 'Ingreso y demostraciones', 25000, 1800, 1100], ['Pase con degustación', 'Ingreso y circuito de degustación', 48000, 400, 240]] }),
  makeEvent({ id: 'e20', title: 'Comunidad Dev: Cierre de Año', description: 'Charlas relámpago, retrospectiva tecnológica y networking para desarrolladores, estudiantes y equipos de producto.', category: 'networking', modality: 'presencial', date: '2026-12-04T18:30', endDate: '2026-12-04T22:30', venueName: 'Complejo Art Media', address: 'Av. Corrientes 6271', city: 'CABA', capacity: 1000, registered: 720, organizerId: 'u4', imageUrl: images.people, tickets: [['Comunidad', 'Acceso general', 18000, 850, 620], ['Sponsor lounge', 'Acceso a espacio de networking', 65000, 150, 100]] }),
]

const makeQR = (code: string) => `EVENTHUB::${code}::2026`

export const seedOrders: Order[] = [
  { id: 'ord1', userId: 'u1', eventId: 'e1', ticketTypeId: 'tt1b', ticketTypeName: 'VIP', quantity: 2, unitPrice: 175000, serviceFee: 14000, total: 364000, status: 'confirmado', purchasedAt: '2026-08-10T10:23:00', tickets: [
    { id: 'TKT-001', orderId: 'ord1', eventId: 'e1', userId: 'u1', ticketTypeId: 'tt1b', ticketTypeName: 'VIP', qrCode: makeQR('TKT-001'), status: 'activo', eventTitle: 'Argentina Tech Summit 2026', eventDate: '2026-09-15T09:00', venueName: 'Centro de Convenciones Buenos Aires', address: 'Av. Pres. Figueroa Alcorta 2099, CABA', holderName: 'María González' },
    { id: 'TKT-002', orderId: 'ord1', eventId: 'e1', userId: 'u1', ticketTypeId: 'tt1b', ticketTypeName: 'VIP', qrCode: makeQR('TKT-002'), status: 'activo', eventTitle: 'Argentina Tech Summit 2026', eventDate: '2026-09-15T09:00', venueName: 'Centro de Convenciones Buenos Aires', address: 'Av. Pres. Figueroa Alcorta 2099, CABA', holderName: 'Invitado' },
  ] },
  { id: 'ord2', userId: 'u1', eventId: 'e5', ticketTypeId: 'tt5b', ticketTypeName: 'Abono 3 jornadas', quantity: 1, unitPrice: 135000, serviceFee: 5400, total: 140400, status: 'confirmado', purchasedAt: '2026-08-14T20:15:00', tickets: [
    { id: 'TKT-003', orderId: 'ord2', eventId: 'e5', userId: 'u1', ticketTypeId: 'tt5b', ticketTypeName: 'Abono 3 jornadas', qrCode: makeQR('TKT-003'), status: 'activo', eventTitle: 'Festival Río Sonoro', eventDate: '2026-10-03T14:00', venueName: 'Parque de la Costa Cultural', address: 'Vivanco 1509, Tigre', holderName: 'María González' },
  ] },
  { id: 'ord3', userId: 'u2', eventId: 'e1', ticketTypeId: 'tt1a', ticketTypeName: 'General', quantity: 1, unitPrice: 85000, serviceFee: 3400, total: 88400, status: 'confirmado', purchasedAt: '2026-08-12T14:05:00', tickets: [
    { id: 'TKT-004', orderId: 'ord3', eventId: 'e1', userId: 'u2', ticketTypeId: 'tt1a', ticketTypeName: 'General', qrCode: makeQR('TKT-004'), status: 'activo', eventTitle: 'Argentina Tech Summit 2026', eventDate: '2026-09-15T09:00', venueName: 'Centro de Convenciones Buenos Aires', address: 'Av. Pres. Figueroa Alcorta 2099, CABA', holderName: 'Javier Romero' },
  ] },
]

export const seedCheckIns: CheckInRecord[] = [
  { id: 'ci1', ticketId: 'TKT-004', eventId: 'e1', attendeeName: 'Javier Romero', ticketType: 'General', checkedInAt: '2026-09-15T08:55:00', result: 'ENTRADA_VALIDA' },
  { id: 'ci2', ticketId: 'TKT-004', eventId: 'e1', attendeeName: 'Javier Romero', ticketType: 'General', checkedInAt: '2026-09-15T09:10:00', result: 'ENTRADA_YA_UTILIZADA' },
]

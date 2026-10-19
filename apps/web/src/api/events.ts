import type { Event, EventModality, EventStatus, TicketType } from '../types'
import { seedUsers } from '../data/seed'

const AUTH_TOKEN_KEY = 'eventhub-access-token'

export function accessToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

async function authed(path: string, init: RequestInit = {}): Promise<unknown> {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  const token = accessToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(path, { ...init, headers })
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string | string[] } | null
    const detail = Array.isArray(body?.message) ? body.message.join(', ') : body?.message
    throw new Error(detail ?? `${init.method ?? 'GET'} ${path} failed: ${response.status}`)
  }
  return response.json()
}

export type ApiEvent = {
  id: string
  legacyId?: string | null
  title: string
  description: string
  category?: string
  modality: 'online' | 'in_person' | 'hybrid'
  date: string
  endDate?: string | null
  venue?: string | null
  location?: string | null
  city?: string | null
  capacity: number
  registered?: number
  status: 'draft' | 'published' | 'cancelled' | 'completed'
  organizerId?: string
  organizerName?: string | null
  imageUrl?: string | null
  featured?: boolean
  ticketTypes?: Array<{
    id: string
    eventId: string
    name: string
    description: string
    price: number
    totalQuantity: number
    sold: number
    status: string
  }>
}

const modalityMap: Record<ApiEvent['modality'], EventModality> = { online: 'online', in_person: 'presencial', hybrid: 'hibrido' }
const modality = (value: ApiEvent['modality']): EventModality => modalityMap[value] ?? 'presencial'
const statusMap: Record<ApiEvent['status'], EventStatus> = {
  draft: 'borrador',
  published: 'publicado',
  cancelled: 'cancelado',
  completed: 'finalizado',
}

const status = (value: ApiEvent['status']): EventStatus => statusMap[value]

// Los organizadores del seed conservan sus ids locales (u3, u4) para que los datos demo sigan asociados.
function organizerIdFor(raw: ApiEvent) {
  return seedUsers.find(user => user.role === 'ORGANIZADOR' && user.name === raw.organizerName)?.id ?? raw.organizerId ?? ''
}

// location guarda "dirección, ciudad" (se usa para geocodificar); se separa para mostrar.
function addressFor(raw: ApiEvent) {
  const location = raw.location ?? ''
  const suffix = raw.city ? `, ${raw.city}` : ''
  if (suffix && location.endsWith(suffix)) return location.slice(0, -suffix.length)
  return raw.city && location === raw.city ? '' : location
}

export function mapApiEvent(raw: ApiEvent): Event {
  const id = raw.legacyId ?? raw.id
  const ticketTypes: TicketType[] = (raw.ticketTypes ?? []).map(ticket => ({
    ...ticket,
    eventId: id,
    priceCents: Math.round(ticket.price * 100),
    status: ticket.status === 'VENDIDO' ? 'VENDIDO' : 'DISPONIBLE',
  }))
  return {
    id,
    title: raw.title,
    description: raw.description,
    category: (raw.category ?? 'conferencia') as Event['category'],
    modality: modality(raw.modality),
    date: raw.date,
    endDate: raw.endDate ?? raw.date,
    venueName: raw.venue ?? '',
    address: addressFor(raw),
    city: raw.city ?? '',
    capacity: raw.capacity,
    registered: raw.registered ?? 0,
    status: status(raw.status),
    organizerId: organizerIdFor(raw),
    organizerName: raw.organizerName ?? '',
    imageUrl: raw.imageUrl ?? undefined,
    ticketTypes,
    saleCutoffDate: raw.date.slice(0, 10),
    maxTicketsPerUser: 4,
    cancellationPolicy: 'Reembolso completo hasta 7 días antes del evento.',
    featured: raw.featured ?? false,
    checkIns: 0,
  }
}

export async function fetchEvents(): Promise<Event[]> {
  const response = await fetch('/api/events')
  if (!response.ok) throw new Error(`Events request failed: ${response.status}`)
  const data = await response.json() as ApiEvent[]
  return data.map(mapApiEvent)
}

export async function fetchOrganizerEvents(): Promise<Event[]> {
  const data = await authed('/api/organizer/events') as ApiEvent[]
  return data.map(mapApiEvent)
}

// Los inputs datetime-local no tienen zona horaria: se envía siempre ISO UTC.
const toIso = (value: string) => new Date(value).toISOString()

const apiModality: Record<EventModality, ApiEvent['modality']> = { online: 'online', presencial: 'in_person', hibrido: 'hybrid' }

// Estado, vendidos, destacados y registrados los decide el backend: no se envían.
export function toApiEvent(ev: Event) {
  return {
    title: ev.title,
    description: ev.description,
    category: ev.category,
    modality: apiModality[ev.modality],
    date: toIso(ev.date),
    endDate: ev.endDate ? toIso(ev.endDate) : null,
    venue: ev.venueName || null,
    location: [ev.address, ev.city].filter(Boolean).join(', ') || null,
    city: ev.city || null,
    capacity: ev.capacity,
    imageUrl: ev.imageUrl ?? null,
    ticketTypes: ev.ticketTypes.map(ticket => ({
      id: ticket.id,
      name: ticket.name,
      description: ticket.description,
      price: ticket.price,
      totalQuantity: ticket.totalQuantity,
    })),
  }
}

export function createEvent(event: Event): Promise<ApiEvent> {
  return authed('/api/organizer/events', { method: 'POST', body: JSON.stringify(toApiEvent(event)) }) as Promise<ApiEvent>
}

export function updateEvent(eventId: string, event: Event): Promise<ApiEvent> {
  return authed(`/api/organizer/events/${eventId}`, { method: 'PATCH', body: JSON.stringify(toApiEvent(event)) }) as Promise<ApiEvent>
}

export function publishEvent(eventId: string): Promise<ApiEvent> {
  return authed(`/api/organizer/events/${eventId}/publish`, { method: 'POST' }) as Promise<ApiEvent>
}

export function cancelEvent(eventId: string): Promise<ApiEvent> {
  return authed(`/api/organizer/events/${eventId}/cancel`, { method: 'POST' }) as Promise<ApiEvent>
}

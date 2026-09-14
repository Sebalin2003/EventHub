import type { Event, EventModality, EventStatus, TicketType } from '../types'

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
  if (!response.ok) throw new Error(`${init.method ?? 'GET'} ${path} failed: ${response.status}`)
  return response.json()
}

type ApiEvent = {
  id: string
  legacyId?: string | null
  title: string
  description: string
  category?: string
  modality: 'online' | 'in_person'
  date: string
  endDate?: string | null
  venue?: string | null
  location?: string | null
  capacity: number
  registered?: number
  status: 'draft' | 'published' | 'cancelled' | 'completed'
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

const modality = (value: ApiEvent['modality']): EventModality => value === 'online' ? 'online' : 'presencial'
const statusMap: Record<ApiEvent['status'], EventStatus> = {
  draft: 'borrador',
  published: 'publicado',
  cancelled: 'cancelado',
  completed: 'finalizado',
}

const status = (value: ApiEvent['status']): EventStatus => statusMap[value]

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
    address: raw.location ?? '',
    city: '',
    capacity: raw.capacity,
    registered: raw.registered ?? 0,
    status: status(raw.status),
    organizerId: raw.organizerName?.startsWith('Río Plata') ? 'u3' : 'u4',
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

const apiModality = (value: EventModality): ApiEvent['modality'] => value === 'online' ? 'online' : 'in_person'
const apiStatus: Record<EventStatus, ApiEvent['status']> = {
  borrador: 'draft',
  publicado: 'published',
  cancelado: 'cancelled',
  finalizado: 'completed',
}

export function toApiEvent(ev: Event) {
  return {
    title: ev.title,
    description: ev.description,
    category: ev.category,
    modality: apiModality(ev.modality),
    date: ev.date,
    endDate: ev.endDate || null,
    venue: ev.venueName || null,
    location: [ev.address, ev.city].filter(Boolean).join(', ') || null,
    capacity: ev.capacity,
    registered: ev.registered,
    status: apiStatus[ev.status],
    organizerName: ev.organizerName,
    imageUrl: ev.imageUrl ?? null,
    featured: ev.featured,
    ticketTypes: ev.ticketTypes.map((ticket): NonNullable<ApiEvent['ticketTypes']>[number] => ({
      id: ticket.id,
      eventId: ev.id,
      name: ticket.name,
      description: ticket.description,
      price: ticket.price,
      totalQuantity: ticket.totalQuantity,
      sold: ticket.sold,
      status: ticket.status,
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

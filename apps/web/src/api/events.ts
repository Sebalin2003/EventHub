import type { Event, EventModality, EventStatus, TicketType } from '../types'

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

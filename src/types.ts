export type EventStatus = 'borrador' | 'publicado' | 'cancelado' | 'finalizado'
export type EventCategory = 'conferencia' | 'taller' | 'networking' | 'webinar' | 'concierto' | 'exposicion'
export type EventModality = 'presencial' | 'online' | 'hibrido'
export type UserRole = 'VISITANTE' | 'ASISTENTE' | 'ORGANIZADOR' | 'STAFF' | 'ADMIN'
export type TicketStatus = 'DISPONIBLE' | 'HOLD' | 'VENDIDO'
export type OrderStatus = 'pendiente' | 'confirmado' | 'cancelado' | 'reembolsado'

export interface UserProfile {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  phone?: string
  joinedAt: string
  active: boolean
}

export interface TicketType {
  id: string
  eventId: string
  name: string
  description: string
  price: number
  totalQuantity: number
  sold: number
  status: TicketStatus
}

export interface Event {
  id: string
  title: string
  description: string
  category: EventCategory
  modality: EventModality
  date: string
  endDate: string
  venueName: string
  address: string
  city: string
  capacity: number
  registered: number
  status: EventStatus
  organizerId: string
  organizerName: string
  imageUrl?: string
  ticketTypes: TicketType[]
  saleCutoffDate?: string
  maxTicketsPerUser: number
  cancellationPolicy: string
  featured: boolean
  checkIns: number
}

export interface Order {
  id: string
  userId: string
  eventId: string
  ticketTypeId: string
  ticketTypeName: string
  quantity: number
  unitPrice: number
  serviceFee: number
  total: number
  status: OrderStatus
  purchasedAt: string
  tickets: Ticket[]
}

export interface Ticket {
  id: string
  orderId: string
  eventId: string
  userId: string
  ticketTypeId: string
  ticketTypeName: string
  qrCode: string
  status: 'activo' | 'usado' | 'cancelado'
  usedAt?: string
  eventTitle: string
  eventDate: string
  venueName: string
  address: string
  holderName: string
}

export interface CheckInRecord {
  id: string
  ticketId: string
  eventId: string
  attendeeName: string
  ticketType: string
  checkedInAt: string
  result: 'ENTRADA_VALIDA' | 'ENTRADA_YA_UTILIZADA' | 'ENTRADA_INVALIDA' | 'ENTRADA_EVENTO_INCORRECTO'
}


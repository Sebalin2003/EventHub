export type EventStatus = 'borrador' | 'publicado' | 'cancelado' | 'finalizado'
export type EventCategory = 'conferencia' | 'taller' | 'networking' | 'webinar' | 'concierto' | 'exposicion'
export type EventModality = 'presencial' | 'online' | 'hibrido'
export type UserRole = 'VISITANTE' | 'ASISTENTE' | 'ORGANIZADOR' | 'STAFF' | 'ADMIN'
export type TicketStatus = 'DISPONIBLE' | 'HOLD' | 'VENDIDO'
export type OrderStatus = 'pendiente' | 'confirmado' | 'cancelado' | 'reembolsado'
export type SeatingMode = 'general' | 'numbered'
export type SeatStatus = 'available' | 'hold' | 'sold'

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

export interface RefundPolicy {
  refundable: boolean
  percentage: number
  cutoffHours: number
  label: string
}

export interface TicketType {
  id: string
  eventId: string
  name: string
  description: string
  price: number
  priceCents?: number
  totalQuantity: number
  sold: number
  status: TicketStatus
}

export interface Sector {
  id: string
  name: string
  ticketTypeId: string
  rows: string[]
}

export interface Seat {
  id: string
  eventId: string
  sectorId: string
  row: string
  number: number
  ticketTypeId: string
  status: SeatStatus
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
  refundPolicy?: RefundPolicy
  featured: boolean
  checkIns: number
  seatingMode?: SeatingMode
  sectors?: Sector[]
  seats?: Seat[]
}

export interface HoldItem {
  ticketTypeId: string
  seatId?: string
}

export interface Hold {
  id: string
  userId: string
  eventId: string
  items: HoldItem[]
  createdAt: string
  expiresAt: string
  status: 'active' | 'expired' | 'released' | 'committed'
}

export interface OrderItem {
  ticketTypeId: string
  ticketTypeName: string
  quantity: number
  unitPriceCents: number
  seatIds: string[]
  seatLabels: string[]
}

export interface PaymentAttempt {
  id: string
  orderId: string
  idempotencyKey: string
  result: 'approved' | 'declined'
  createdAt: string
}

export interface Refund {
  id: string
  orderId: string
  requestedAt: string
  paidCents: number
  deductionCents: number
  refundCents: number
  destination: string
  status: 'processing' | 'approved' | 'failed'
  idempotencyKey: string
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
  unitPriceCents?: number
  subtotalCents?: number
  serviceFeeCents?: number
  totalCents?: number
  status: OrderStatus
  purchasedAt: string
  holdId?: string
  items?: OrderItem[]
  paymentAttemptId?: string
  refundPolicySnapshot?: RefundPolicy
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
  seatId?: string
  seatLabel?: string
}

export interface CheckInRecord {
  id: string
  ticketId: string
  eventId: string
  attendeeName: string
  ticketType: string
  checkedInAt: string
  operatorId?: string
  result: 'ENTRADA_VALIDA' | 'ENTRADA_YA_UTILIZADA' | 'ENTRADA_INVALIDA' | 'ENTRADA_EVENTO_INCORRECTO'
}

export interface AuditEntry {
  id: string
  actorId: string
  actorLabel: string
  action: string
  resourceId: string
  detail: string
  createdAt: string
  result: 'success' | 'failure'
}

export interface DemoState {
  version: 3
  currentUserId: string | null
  events: Event[]
  orders: Order[]
  favoritesByUser: Record<string, string[]>
  holds: Hold[]
  payments: PaymentAttempt[]
  refunds: Refund[]
  checkIns: CheckInRecord[]
  audit: AuditEntry[]
}

export interface CheckoutSelection {
  ticketTypeId: string
  quantity: number
  seatIds: string[]
}

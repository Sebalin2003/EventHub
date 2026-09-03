import { useEffect, useMemo, useReducer } from 'react'
import { seedCheckIns, seedEvents, seedOrders } from './data/seed'
import type {
  AuditEntry,
  CheckInRecord,
  CheckoutSelection,
  DemoState,
  Event,
  Hold,
  Order,
  PaymentAttempt,
  Refund,
  RefundPolicy,
  Seat,
  Sector,
  Ticket,
} from './types'

export const STORAGE_KEY = 'eventhub-demo-v3'
export const HOLD_DURATION_MS = 5 * 60 * 1000

const defaultRefundPolicy: RefundPolicy = {
  refundable: true,
  percentage: 100,
  cutoffHours: 24 * 7,
  label: 'Reembolso completo hasta 7 días antes del evento.',
}

const id = (prefix: string) => `${prefix}-${crypto.randomUUID()}`
export const formatMoney = (cents: number, locale = 'es-AR') =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(cents / 100)

function buildSeating(event: Event): Pick<Event, 'seatingMode' | 'sectors' | 'seats'> {
  if (event.id !== 'e1') return { seatingMode: 'general', sectors: [], seats: [] }
  const specs = [
    { id: 'general', name: 'Platea', ticketTypeId: 'tt1a', rows: ['A', 'B'] },
    { id: 'vip', name: 'VIP', ticketTypeId: 'tt1b', rows: ['C', 'D'] },
    { id: 'premium', name: 'Premium', ticketTypeId: 'tt1c', rows: ['E', 'F'] },
  ]
  const sectors: Sector[] = specs.map(({ id: sectorId, name, ticketTypeId, rows }) => ({
    id: `sec-${sectorId}`,
    name,
    ticketTypeId,
    rows,
  }))
  const seats: Seat[] = sectors.flatMap(sector =>
    sector.rows.flatMap(row =>
      Array.from({ length: 8 }, (_, index) => ({
        id: `${event.id}-${sector.id}-${row}-${index + 1}`,
        eventId: event.id,
        sectorId: sector.id,
        row,
        number: index + 1,
        ticketTypeId: sector.ticketTypeId,
        status: index === 7 && row === sector.rows[0] ? 'sold' as const : 'available' as const,
      })),
    ),
  )
  return { seatingMode: 'numbered', sectors, seats }
}

function policyFor(event: Event): RefundPolicy {
  if (event.id === 'e2' || event.id === 'e3' || event.id === 'e4') {
    return { refundable: false, percentage: 0, cutoffHours: 0, label: event.cancellationPolicy }
  }
  if (event.id === 'e5') {
    return { refundable: true, percentage: 80, cutoffHours: 24 * 15, label: event.cancellationPolicy }
  }
  return { ...defaultRefundPolicy, label: event.cancellationPolicy }
}

function enrichEvent(event: Event): Event {
  const seating = event.seatingMode ? { seatingMode: event.seatingMode, sectors: event.sectors ?? [], seats: event.seats ?? [] } : buildSeating(event)
  return {
    ...event,
    ...seating,
    refundPolicy: policyFor(event),
    ticketTypes: event.ticketTypes.map(type => ({ ...type, priceCents: Math.round(type.price * 100) })),
  }
}

function enrichOrder(order: Order, events: Event[]): Order {
  const event = events.find(item => item.id === order.eventId)
  const unitPriceCents = Math.round(order.unitPrice * 100)
  const serviceFeeCents = Math.round(order.serviceFee * 100)
  const totalCents = Math.round(order.total * 100)
  return {
    ...order,
    unitPriceCents,
    subtotalCents: unitPriceCents * order.quantity,
    serviceFeeCents,
    totalCents,
    refundPolicySnapshot: event?.refundPolicy ?? defaultRefundPolicy,
    items: [{
      ticketTypeId: order.ticketTypeId,
      ticketTypeName: order.ticketTypeName,
      quantity: order.quantity,
      unitPriceCents,
      seatIds: [],
      seatLabels: [],
    }],
  }
}

export function makeInitialDemoState(now = Date.now()): DemoState {
  const events = seedEvents.map(enrichEvent)
  const orders = seedOrders.map(order => enrichOrder(order, events))
  const externalHold: Hold = {
    id: 'hold-demo-external',
    userId: 'u2',
    eventId: 'e1',
    items: [{ ticketTypeId: 'tt1a', seatId: 'e1-sec-general-A-2' }],
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + HOLD_DURATION_MS).toISOString(),
    status: 'active',
  }
  return {
    version: 3,
    currentUserId: null,
    events,
    orders,
    favoritesByUser: { u1: ['e5'], u2: ['e1'] },
    holds: [externalHold],
    payments: [],
    refunds: [],
    checkIns: seedCheckIns,
    audit: [
      audit('u3', 'TechMadrid S.L.', 'EVENTO_PUBLICADO', 'e1', 'Cumbre de Innovación Digital 2026'),
      audit('u1', 'María González', 'COMPRA_CONFIRMADA', 'ord1', 'Orden ord1 confirmada'),
    ],
  }
}

function audit(actorId: string, actorLabel: string, action: string, resourceId: string, detail: string, result: AuditEntry['result'] = 'success'): AuditEntry {
  return { id: id('audit'), actorId, actorLabel, action, resourceId, detail, createdAt: new Date().toISOString(), result }
}

export function expireHolds(state: DemoState, now = Date.now()): DemoState {
  let changed = false
  const holds = state.holds.map(hold => {
    if (hold.status === 'active' && new Date(hold.expiresAt).getTime() <= now) {
      changed = true
      return { ...hold, status: 'expired' as const }
    }
    return hold
  })
  return changed ? { ...state, holds } : state
}

export function activeHolds(state: DemoState, eventId?: string, now = Date.now()) {
  return state.holds.filter(hold => hold.status === 'active' && new Date(hold.expiresAt).getTime() > now && (!eventId || hold.eventId === eventId))
}

export function effectiveAvailability(state: DemoState, eventId: string, ticketTypeId: string, now = Date.now()) {
  const event = state.events.find(item => item.id === eventId)
  const type = event?.ticketTypes.find(item => item.id === ticketTypeId)
  if (!type) return 0
  const held = activeHolds(state, eventId, now).flatMap(hold => hold.items).filter(item => item.ticketTypeId === ticketTypeId).length
  return Math.max(0, type.totalQuantity - type.sold - held)
}

export function isSeatUnavailable(state: DemoState, event: Event, seat: Seat, userId?: string | null, now = Date.now()) {
  if (seat.status === 'sold') return true
  return activeHolds(state, event.id, now).some(hold => hold.userId !== userId && hold.items.some(item => item.seatId === seat.id))
}

export type DemoAction =
  | { type: 'LOGIN'; userId: string }
  | { type: 'LOGOUT' }
  | { type: 'TOGGLE_FAVORITE'; userId: string; eventId: string }
  | { type: 'EXPIRE_HOLDS'; now?: number }
  | { type: 'CREATE_HOLD'; hold: Hold }
  | { type: 'RELEASE_HOLD'; holdId: string }
  | { type: 'COMPLETE_PURCHASE'; order: Order; payment: PaymentAttempt }
  | { type: 'RECORD_PAYMENT_FAILURE'; holdId: string; payment: PaymentAttempt; actorLabel: string }
  | { type: 'REFUND_ORDER'; refund: Refund; actorLabel: string }
  | { type: 'CHECK_IN'; record: CheckInRecord; operatorLabel: string }
  | { type: 'UPSERT_EVENT'; event: Event; actorLabel: string }
  | { type: 'SET_EVENT_STATUS'; eventId: string; status: Event['status']; actorId: string; actorLabel: string }
  | { type: 'RESET'; now?: number }

export function demoReducer(rawState: DemoState, action: DemoAction): DemoState {
  const state = expireHolds(rawState, action.type === 'EXPIRE_HOLDS' ? action.now : undefined)
  switch (action.type) {
    case 'LOGIN': return { ...state, currentUserId: action.userId }
    case 'LOGOUT': return { ...state, currentUserId: null }
    case 'EXPIRE_HOLDS': return state
    case 'RESET': return makeInitialDemoState(action.now)
    case 'TOGGLE_FAVORITE': {
      const current = state.favoritesByUser[action.userId] ?? []
      const next = current.includes(action.eventId) ? current.filter(id => id !== action.eventId) : [...current, action.eventId]
      return { ...state, favoritesByUser: { ...state.favoritesByUser, [action.userId]: next } }
    }
    case 'CREATE_HOLD': {
      const duplicate = activeHolds(state, action.hold.eventId).some(hold =>
        hold.id !== action.hold.id && hold.items.some(item => action.hold.items.some(candidate => candidate.seatId && candidate.seatId === item.seatId)),
      )
      if (duplicate) return state
      return { ...state, holds: [...state.holds.filter(hold => hold.id !== action.hold.id), action.hold] }
    }
    case 'RELEASE_HOLD': return { ...state, holds: state.holds.map(hold => hold.id === action.holdId ? { ...hold, status: 'released' } : hold) }
    case 'RECORD_PAYMENT_FAILURE': return {
      ...state,
      holds: state.holds.map(hold => hold.id === action.holdId ? { ...hold, status: 'released' } : hold),
      payments: [...state.payments, action.payment],
      audit: [audit(action.payment.orderId, action.actorLabel, 'PAGO_RECHAZADO', action.payment.orderId, 'El proveedor simulado rechazó el pago', 'failure'), ...state.audit],
    }
    case 'COMPLETE_PURCHASE': {
      if (state.payments.some(payment => payment.idempotencyKey === action.payment.idempotencyKey) || state.orders.some(order => order.id === action.order.id)) return state
      const seatIds = new Set(action.order.items?.flatMap(item => item.seatIds) ?? [])
      const events = state.events.map(event => event.id !== action.order.eventId ? event : {
        ...event,
        registered: event.registered + action.order.quantity,
        ticketTypes: event.ticketTypes.map(type => type.id === action.order.ticketTypeId ? { ...type, sold: type.sold + action.order.quantity } : type),
        seats: event.seats?.map(seat => seatIds.has(seat.id) ? { ...seat, status: 'sold' as const } : seat),
      })
      return {
        ...state,
        events,
        orders: [action.order, ...state.orders],
        holds: state.holds.map(hold => hold.id === action.order.holdId ? { ...hold, status: 'committed' } : hold),
        payments: [...state.payments, action.payment],
        audit: [audit(action.order.userId, action.order.tickets[0]?.holderName ?? 'Asistente', 'COMPRA_CONFIRMADA', action.order.id, `Orden ${action.order.id} confirmada`), ...state.audit],
      }
    }
    case 'REFUND_ORDER': {
      if (state.refunds.some(refund => refund.idempotencyKey === action.refund.idempotencyKey)) return state
      const order = state.orders.find(item => item.id === action.refund.orderId)
      if (!order) return state
      if (action.refund.status === 'failed') return {
        ...state,
        refunds: [...state.refunds, action.refund],
        audit: [audit(order.userId, action.actorLabel, 'REEMBOLSO_FALLIDO', order.id, `Falló el reembolso de ${order.id}`, 'failure'), ...state.audit],
      }
      const seatIds = new Set(order.tickets.map(ticket => ticket.seatId).filter(Boolean))
      return {
        ...state,
        refunds: [...state.refunds, action.refund],
        orders: state.orders.map(item => item.id === order.id ? { ...item, status: 'reembolsado', tickets: item.tickets.map(ticket => ({ ...ticket, status: 'cancelado' })) } : item),
        events: state.events.map(event => event.id !== order.eventId ? event : {
          ...event,
          registered: Math.max(0, event.registered - order.quantity),
          ticketTypes: event.ticketTypes.map(type => type.id === order.ticketTypeId ? { ...type, sold: Math.max(0, type.sold - order.quantity) } : type),
          seats: event.seats?.map(seat => seatIds.has(seat.id) ? { ...seat, status: 'available' as const } : seat),
        }),
        audit: [audit(order.userId, action.actorLabel, 'REEMBOLSO_APROBADO', order.id, `Orden ${order.id} reembolsada`), ...state.audit],
      }
    }
    case 'CHECK_IN': {
      const alreadyUsed = state.checkIns.some(record => record.ticketId === action.record.ticketId && record.result === 'ENTRADA_VALIDA')
      const validTransition = action.record.result === 'ENTRADA_VALIDA' && !alreadyUsed
      return {
        ...state,
        checkIns: [action.record, ...state.checkIns],
        events: state.events.map(event => event.id === action.record.eventId && validTransition ? { ...event, checkIns: event.checkIns + 1 } : event),
        orders: state.orders.map(order => ({ ...order, tickets: order.tickets.map(ticket => ticket.id === action.record.ticketId && validTransition ? { ...ticket, status: 'usado', usedAt: action.record.checkedInAt } : ticket) })),
        audit: [audit(action.record.operatorId ?? '', action.operatorLabel, 'CHECK_IN', action.record.ticketId, action.record.result, action.record.result === 'ENTRADA_VALIDA' ? 'success' : 'failure'), ...state.audit],
      }
    }
    case 'UPSERT_EVENT': {
      const exists = state.events.some(event => event.id === action.event.id)
      return {
        ...state,
        events: exists ? state.events.map(event => event.id === action.event.id ? enrichEvent(action.event) : event) : [enrichEvent(action.event), ...state.events],
        audit: [audit(action.event.organizerId, action.actorLabel, exists ? 'EVENTO_EDITADO' : 'EVENTO_CREADO', action.event.id, action.event.title), ...state.audit],
      }
    }
    case 'SET_EVENT_STATUS': {
      if (action.status !== 'cancelado') return {
        ...state,
        events: state.events.map(event => event.id === action.eventId ? { ...event, status: action.status } : event),
        audit: [audit(action.actorId, action.actorLabel, `EVENTO_${action.status.toUpperCase()}`, action.eventId, `Estado cambiado a ${action.status}`), ...state.audit],
      }
      const affected = state.orders.filter(order => order.eventId === action.eventId && order.status === 'confirmado')
      const refunds: Refund[] = affected.map(order => {
        const paidCents = order.totalCents ?? Math.round(order.total * 100)
        return { id: id('refund'), orderId: order.id, requestedAt: new Date().toISOString(), paidCents, deductionCents: 0, refundCents: paidCents, destination: 'Medio de pago original', status: 'approved', idempotencyKey: `event-cancel-${action.eventId}-${order.id}` }
      })
      return {
        ...state,
        events: state.events.map(event => event.id === action.eventId ? { ...event, status: 'cancelado' } : event),
        orders: state.orders.map(order => order.eventId === action.eventId && order.status === 'confirmado' ? { ...order, status: 'reembolsado', tickets: order.tickets.map(ticket => ({ ...ticket, status: 'cancelado' })) } : order),
        refunds: [...state.refunds, ...refunds],
        audit: [audit(action.actorId, action.actorLabel, 'EVENTO_CANCELADO', action.eventId, `${affected.length} órdenes afectadas y enviadas a reembolso`), ...state.audit],
      }
    }
  }
}

export function createHold(userId: string, eventId: string, selection: CheckoutSelection, now = Date.now()): Hold {
  return {
    id: id('hold'),
    userId,
    eventId,
    items: Array.from({ length: selection.quantity }, (_, index) => ({ ticketTypeId: selection.ticketTypeId, seatId: selection.seatIds[index] })),
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + HOLD_DURATION_MS).toISOString(),
    status: 'active',
  }
}

export function buildOrder(state: DemoState, userId: string, userName: string, event: Event, selection: CheckoutSelection, hold: Hold, idempotencyKey: string, now = Date.now()) {
  const type = event.ticketTypes.find(item => item.id === selection.ticketTypeId)!
  const unitPriceCents = type.priceCents ?? Math.round(type.price * 100)
  const subtotalCents = unitPriceCents * selection.quantity
  const serviceFeeCents = Math.round(subtotalCents * 0.04)
  const totalCents = subtotalCents + serviceFeeCents
  const orderId = id('ORD')
  const seatLabels = selection.seatIds.map(seatId => {
    const seat = event.seats?.find(item => item.id === seatId)
    const sector = event.sectors?.find(item => item.id === seat?.sectorId)
    return seat ? `${sector?.name ?? 'Sector'} · Fila ${seat.row} · Asiento ${seat.number}` : ''
  })
  const tickets: Ticket[] = Array.from({ length: selection.quantity }, (_, index) => ({
    id: id('TKT'), orderId, eventId: event.id, userId, ticketTypeId: type.id, ticketTypeName: type.name,
    qrCode: `EVENTHUB::${orderId}::${index + 1}`, status: 'activo', eventTitle: event.title, eventDate: event.date,
    venueName: event.venueName, address: event.address ? `${event.address}, ${event.city}` : event.city,
    holderName: index === 0 ? userName : `Invitado ${index + 1}`, seatId: selection.seatIds[index], seatLabel: seatLabels[index],
  }))
  const paymentAttemptId = id('pay')
  const order: Order = {
    id: orderId, userId, eventId: event.id, ticketTypeId: type.id, ticketTypeName: type.name,
    quantity: selection.quantity, unitPrice: unitPriceCents / 100, serviceFee: serviceFeeCents / 100, total: totalCents / 100,
    unitPriceCents, subtotalCents, serviceFeeCents, totalCents, status: 'confirmado', purchasedAt: new Date(now).toISOString(),
    holdId: hold.id, paymentAttemptId, refundPolicySnapshot: event.refundPolicy ?? defaultRefundPolicy,
    items: [{ ticketTypeId: type.id, ticketTypeName: type.name, quantity: selection.quantity, unitPriceCents, seatIds: selection.seatIds, seatLabels }],
    tickets,
  }
  const payment: PaymentAttempt = { id: paymentAttemptId, orderId, idempotencyKey, result: 'approved', createdAt: new Date(now).toISOString() }
  return { order, payment }
}

export function hydrateDemoState(raw: string | null): DemoState {
  try {
    const parsed = JSON.parse(raw ?? 'null') as DemoState | null
    if (parsed?.version === 3) return expireHolds(parsed)
  } catch { /* A corrupt demo snapshot safely falls back to seed data. */ }
  return makeInitialDemoState()
}

function loadState() {
  return hydrateDemoState(localStorage.getItem(STORAGE_KEY))
}

export function useDemoStore() {
  const [state, dispatch] = useReducer(demoReducer, undefined, loadState)
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(state)), [state])
  useEffect(() => {
    const timer = window.setInterval(() => dispatch({ type: 'EXPIRE_HOLDS' }), 1000)
    return () => window.clearInterval(timer)
  }, [])
  return useMemo(() => ({ state, dispatch }), [state])
}

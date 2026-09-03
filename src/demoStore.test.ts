import { describe, expect, it } from 'vitest'
import { buildOrder, createHold, demoReducer, effectiveAvailability, expireHolds, formatMoney, hydrateDemoState, makeInitialDemoState } from './demoStore'
import type { CheckInRecord, Hold, PaymentAttempt, Refund } from './types'

describe('demo store', () => {
  it('starts with exactly 20 Argentine events and ARS money formatting', () => {
    const state = makeInitialDemoState(1_000)
    expect(state.events).toHaveLength(20)
    expect(state.events.every(event => ['CABA', 'Online'].includes(event.city) || /Argentina|Córdoba|Rosario|Tigre|Mendoza|Salta|Plata|Neuquén|Bariloche|San Juan|Ushuaia|Mar del Plata/.test(`${event.city} ${event.description}`))).toBe(true)
    expect(formatMoney(8_500_000)).not.toContain('€')
    expect(formatMoney(8_500_000)).toContain('85.000')
  })

  it('keeps favorites isolated by user and survives serialization', () => {
    const initial = makeInitialDemoState(1_000)
    const changed = demoReducer(initial, { type: 'TOGGLE_FAVORITE', userId: 'u1', eventId: 'e1' })
    expect(changed.favoritesByUser.u1).toContain('e1')
    expect(changed.favoritesByUser.u2).toEqual(['e1'])
    expect(hydrateDemoState(JSON.stringify(changed)).favoritesByUser.u1).toContain('e1')
  })

  it('expires holds and returns held inventory', () => {
    const state = makeInitialDemoState(1_000)
    const before = effectiveAvailability(state, 'e1', 'tt1a', 1_500)
    const expired = expireHolds(state, 1_000 + 5 * 60 * 1000 + 1)
    expect(effectiveAvailability(expired, 'e1', 'tt1a', 1_000 + 5 * 60 * 1000 + 1)).toBe(before + 1)
    expect(expired.holds[0].status).toBe('expired')
  })

  it('does not allow the same seat in two active holds', () => {
    const now = Date.now()
    const state = makeInitialDemoState(now)
    const first = createHold('u1', 'e1', { ticketTypeId: 'tt1a', quantity: 1, seatIds: ['e1-sec-general-A-3'] }, now)
    const second: Hold = { ...createHold('u2', 'e1', { ticketTypeId: 'tt1a', quantity: 1, seatIds: ['e1-sec-general-A-3'] }, now + 1), id: 'second' }
    const withFirst = demoReducer(state, { type: 'CREATE_HOLD', hold: first })
    const withSecond = demoReducer(withFirst, { type: 'CREATE_HOLD', hold: second })
    expect(withSecond.holds.some(hold => hold.id === 'second')).toBe(false)
  })

  it('confirms a purchase only once for an idempotency key', () => {
    const now = Date.now()
    const state = makeInitialDemoState(now)
    const event = state.events.find(item => item.id === 'e1')!
    const hold = createHold('u1', event.id, { ticketTypeId: 'tt1a', quantity: 1, seatIds: ['e1-sec-general-A-3'] }, now)
    const selected = { ticketTypeId: 'tt1a', quantity: 1, seatIds: ['e1-sec-general-A-3'] }
    const { order, payment } = buildOrder(state, 'u1', 'María González', event, selected, hold, 'same-key', now + 100)
    const once = demoReducer(demoReducer(state, { type: 'CREATE_HOLD', hold }), { type: 'COMPLETE_PURCHASE', order, payment })
    const twice = demoReducer(once, { type: 'COMPLETE_PURCHASE', order, payment })
    expect(twice.orders.filter(item => item.id === order.id)).toHaveLength(1)
    expect(twice.events.find(item => item.id === event.id)?.seats?.find(seat => seat.id === selected.seatIds[0])?.status).toBe('sold')
  })

  it('refunds an order, cancels tickets and restores inventory', () => {
    const state = makeInitialDemoState(1_000)
    const order = state.orders.find(item => item.id === 'ord1')!
    const before = state.events.find(item => item.id === order.eventId)!.ticketTypes.find(type => type.id === order.ticketTypeId)!.sold
    const refund: Refund = { id: 'refund-1', orderId: order.id, requestedAt: new Date().toISOString(), paidCents: order.totalCents!, deductionCents: 0, refundCents: order.totalCents!, destination: 'Medio original', status: 'approved', idempotencyKey: 'refund-key' }
    const next = demoReducer(state, { type: 'REFUND_ORDER', refund, actorLabel: 'María González' })
    expect(next.orders.find(item => item.id === order.id)?.status).toBe('reembolsado')
    expect(next.orders.find(item => item.id === order.id)?.tickets.every(ticket => ticket.status === 'cancelado')).toBe(true)
    expect(next.events.find(item => item.id === order.eventId)!.ticketTypes.find(type => type.id === order.ticketTypeId)!.sold).toBe(before - order.quantity)
  })

  it('records one valid check-in and rejects a repeated transition', () => {
    const state = makeInitialDemoState(1_000)
    const record: CheckInRecord = { id: 'ci-new', ticketId: 'TKT-001', eventId: 'e1', attendeeName: 'María González', ticketType: 'VIP', checkedInAt: new Date().toISOString(), operatorId: 'u5', result: 'ENTRADA_VALIDA' }
    const once = demoReducer(state, { type: 'CHECK_IN', record, operatorLabel: 'Carlos Staff' })
    const twice = demoReducer(once, { type: 'CHECK_IN', record: { ...record, id: 'ci-repeat', result: 'ENTRADA_YA_UTILIZADA' }, operatorLabel: 'Carlos Staff' })
    expect(once.orders.flatMap(order => order.tickets).find(ticket => ticket.id === record.ticketId)?.status).toBe('usado')
    expect(twice.checkIns.filter(item => item.ticketId === record.ticketId && item.result === 'ENTRADA_VALIDA')).toHaveLength(1)
  })

  it('releases inventory after a declined payment', () => {
    const now = Date.now()
    const state = makeInitialDemoState(now)
    const hold = createHold('u1', 'e1', { ticketTypeId: 'tt1a', quantity: 1, seatIds: ['e1-sec-general-A-4'] }, now)
    const withHold = demoReducer(state, { type: 'CREATE_HOLD', hold })
    const payment: PaymentAttempt = { id: 'pay-declined', orderId: 'failed', idempotencyKey: 'declined-key', result: 'declined', createdAt: new Date().toISOString() }
    const next = demoReducer(withHold, { type: 'RECORD_PAYMENT_FAILURE', holdId: hold.id, payment, actorLabel: 'María González' })
    expect(next.holds.find(item => item.id === hold.id)?.status).toBe('released')
  })
})

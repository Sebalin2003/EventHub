import { useEffect, useMemo, useRef, useState } from 'react'
import type { DemoAction } from '../../demoStore'
import { activeHolds, buildOrder, createHold, effectiveAvailability, formatMoney, isSeatUnavailable } from '../../demoStore'
import type { CheckoutSelection, DemoState, Event, Hold, PaymentAttempt, Seat, UserProfile } from '../../types'
import { Breadcrumb, StatusBadge, useToast } from '../shared/Ui'
import { useI18n } from '../../i18n'

type Props = {
  state: DemoState
  event: Event
  currentUser: UserProfile
  dispatch: React.Dispatch<DemoAction>
  onComplete: (orderId: string) => void
  onCancel: () => void
  onHome: () => void
}

type Step = 'select' | 'payment' | 'processing'
type DemoOutcome = 'approved' | 'declined'

function SeatButton({ seat, status, onToggle }: { seat: Seat; status: 'available' | 'selected' | 'hold' | 'sold'; onToggle: () => void }) {
  const unavailable = status === 'hold' || status === 'sold'
  const label = `Fila ${seat.row}, asiento ${seat.number}, ${status === 'hold' ? 'en HOLD' : status === 'sold' ? 'vendido' : status === 'selected' ? 'seleccionado' : 'disponible'}`
  return <button type="button" className={`seat seat--${status}`} disabled={unavailable} aria-pressed={status === 'selected'} aria-label={label} onClick={onToggle}>{seat.number}</button>
}

export default function CheckoutPage({ state, event, currentUser, dispatch, onComplete, onCancel, onHome }: Props) {
  const { notify } = useToast()
  const { t, locale } = useI18n()
  const [step, setStep] = useState<Step>('select')
  const [ticketTypeId, setTicketTypeId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [seatIds, setSeatIds] = useState<string[]>([])
  const [hold, setHold] = useState<Hold | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [payMethod, setPayMethod] = useState('card')
  const [outcome, setOutcome] = useState<DemoOutcome>('approved')
  const [error, setError] = useState('')
  const idempotencyKey = useRef(crypto.randomUUID())
  const selectedType = event.ticketTypes.find(type => type.id === ticketTypeId)
  const selectedSector = event.sectors?.find(sector => sector.ticketTypeId === ticketTypeId)
  const effectiveQuantity = event.seatingMode === 'numbered' ? seatIds.length : quantity
  const subtotalCents = (selectedType?.priceCents ?? Math.round((selectedType?.price ?? 0) * 100)) * effectiveQuantity
  const feeCents = Math.round(subtotalCents * 0.04)
  const selection: CheckoutSelection = { ticketTypeId, quantity: effectiveQuantity, seatIds }

  const seats = useMemo(() => event.seats?.filter(seat => seat.ticketTypeId === ticketTypeId) ?? [], [event.seats, ticketTypeId])
  const heldSeatIds = useMemo(() => new Set(activeHolds(state, event.id).filter(item => item.userId !== currentUser.id).flatMap(item => item.items.map(held => held.seatId).filter(Boolean))), [state.holds, event.id, currentUser.id])
  const seatState = (seat: Seat) => seatIds.includes(seat.id) ? 'selected' as const : seat.status === 'sold' ? 'sold' as const : heldSeatIds.has(seat.id) ? 'hold' as const : 'available' as const

  useEffect(() => {
    if (!hold) return
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((new Date(hold.expiresAt).getTime() - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining === 0) {
        dispatch({ type: 'RELEASE_HOLD', holdId: hold.id })
        setHold(null)
        setStep('select')
        setError('La reserva temporal venció. Vuelve a seleccionar tus entradas.')
        notify('La reserva temporal venció y el inventario fue liberado.', 'error')
      }
    }
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [hold, dispatch, notify])

  function toggleSeat(seatId: string) {
    setSeatIds(current => current.includes(seatId) ? current.filter(id => id !== seatId) : current.length < event.maxTicketsPerUser ? [...current, seatId] : current)
  }

  function confirmSelection() {
    setError('')
    if (!selectedType || effectiveQuantity < 1) { setError(event.seatingMode === 'numbered' ? 'Selecciona al menos un asiento.' : 'Selecciona un tipo de entrada.'); return }
    if (effectiveQuantity > event.maxTicketsPerUser || effectiveQuantity > effectiveAvailability(state, event.id, selectedType.id)) { setError('La cantidad supera la disponibilidad o el límite por usuario.'); return }
    if (event.seatingMode === 'numbered' && seatIds.some(id => {
      const seat = event.seats?.find(item => item.id === id)
      return !seat || isSeatUnavailable(state, event, seat, currentUser.id)
    })) { setError('Uno de los asientos dejó de estar disponible. Actualiza tu selección.'); return }
    const nextHold = createHold(currentUser.id, event.id, selection)
    dispatch({ type: 'CREATE_HOLD', hold: nextHold })
    setHold(nextHold)
    setStep('payment')
    notify(`Reserva temporal creada por ${Math.round((new Date(nextHold.expiresAt).getTime() - Date.now()) / 60000)} minutos.`, 'info')
  }

  function cancelCheckout() {
    if (hold) dispatch({ type: 'RELEASE_HOLD', holdId: hold.id })
    onCancel()
  }

  function pay(eventSubmit: React.FormEvent<HTMLFormElement>) {
    eventSubmit.preventDefault()
    if (!hold || !selectedType) return
    setError('')
    setStep('processing')
    window.setTimeout(() => {
      if (outcome === 'declined') {
        const payment: PaymentAttempt = { id: `pay-${crypto.randomUUID()}`, orderId: `failed-${crypto.randomUUID()}`, idempotencyKey: idempotencyKey.current, result: 'declined', createdAt: new Date().toISOString() }
        dispatch({ type: 'RECORD_PAYMENT_FAILURE', holdId: hold.id, payment, actorLabel: currentUser.name })
        setHold(null)
        setStep('select')
        setError('El pago fue rechazado. No se realizó ningún cargo y la reserva se liberó.')
        idempotencyKey.current = crypto.randomUUID()
        notify('Pago rechazado. Revisa el medio de pago y vuelve a intentarlo.', 'error')
        return
      }
      const { order, payment } = buildOrder(state, currentUser.id, currentUser.name, event, selection, hold, idempotencyKey.current)
      dispatch({ type: 'COMPLETE_PURCHASE', order, payment })
      notify('Compra confirmada. Tus entradas ya están disponibles.', 'success')
      onComplete(order.id)
    }, 900)
  }

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const seconds = String(timeLeft % 60).padStart(2, '0')

  return <main className="page-shell checkout-page">
    <Breadcrumb items={[{ label: t('home'), onClick: onHome }, { label: event.title, onClick: cancelCheckout }, { label: t('checkout') }]} />
    <div className="page-heading"><h1>{t('checkout')}</h1><p>{t('checkoutBody')}</p></div>
    {error && <div className="form-error" role="alert">{error}</div>}
    {step === 'processing' ? <section className="processing-state" aria-live="polite"><div className="processing-mark" aria-hidden="true" /><h2>{t('processing')}</h2><p>{t('processingBody')}</p></section> :
      <div className="checkout-layout">
        <div className="checkout-steps">
          <section className={`checkout-step${step === 'select' ? ' is-active' : ' is-complete'}`}>
            <header><span>{step === 'select' ? '1' : '✓'}</span><div><h2>{t('selectTickets')}</h2><p>{t('typeQuantitySeat')}</p></div></header>
            {step === 'select' && <div className="checkout-step__body">
              <fieldset className="ticket-choice"><legend>{t('ticketType')}</legend>{event.ticketTypes.map(type => {
                const available = effectiveAvailability(state, event.id, type.id)
                return <label key={type.id} className={ticketTypeId === type.id ? 'is-selected' : ''}><input type="radio" name="ticketType" value={type.id} checked={ticketTypeId === type.id} disabled={available === 0} onChange={() => { setTicketTypeId(type.id); setSeatIds([]); setQuantity(1) }} /><span><b>{type.name}</b><small>{available} {t('available')}</small></span><strong>{type.price === 0 ? t('free') : formatMoney(type.priceCents ?? type.price * 100, locale)}</strong></label>
              })}</fieldset>
              {selectedType && event.seatingMode !== 'numbered' && <div className="quantity-control"><span>Cantidad</span><button type="button" onClick={() => setQuantity(value => Math.max(1, value - 1))} aria-label="Quitar una entrada">−</button><output>{quantity}</output><button type="button" onClick={() => setQuantity(value => Math.min(event.maxTicketsPerUser, effectiveAvailability(state, event.id, selectedType.id), value + 1))} aria-label="Añadir una entrada">+</button><small>Máx. {event.maxTicketsPerUser}</small></div>}
              {selectedType && event.seatingMode === 'numbered' && selectedSector && <section className="seat-picker"><div className="seat-picker__heading"><div><h3>{selectedSector.name}</h3><p>Escenario</p></div><StatusBadge tone="info">{seatIds.length} seleccionados</StatusBadge></div><div className="seat-legend"><span><i className="available" />Disponible</span><span><i className="selected" />Seleccionado</span><span><i className="hold" />HOLD</span><span><i className="sold" />Vendido</span></div><div className="seat-map" aria-label={`Asientos de ${selectedSector.name}`}>{selectedSector.rows.map(row => <div className="seat-row" key={row}><b>{row}</b>{seats.filter(seat => seat.row === row).map(seat => <SeatButton key={seat.id} seat={seat} status={seatState(seat)} onToggle={() => toggleSeat(seat.id)} />)}</div>)}</div><details className="seat-text-list"><summary>Alternativa textual de asientos</summary><ul>{seats.map(seat => <li key={seat.id}>Fila {seat.row}, asiento {seat.number}: {seatState(seat) === 'hold' ? 'en HOLD' : seatState(seat) === 'sold' ? 'vendido' : seatState(seat) === 'selected' ? 'seleccionado' : 'disponible'}</li>)}</ul></details></section>}
              <button className="button button--secondary" type="button" onClick={confirmSelection}>Reservar y continuar</button>
            </div>}
          </section>
          <section className={`checkout-step${step === 'payment' ? ' is-active' : ''}`} aria-disabled={step !== 'payment'}>
            <header><span>2</span><div><h2>{t('paymentMethod')}</h2><p>{t('paymentData')}</p></div></header>
            {step === 'payment' && <form className="checkout-step__body payment-form" onSubmit={pay}>
              <fieldset className="payment-methods"><legend>{t('paymentMethod')}</legend>{[['card', t('card')], ['paypal', t('paypal')], ['mercado-pago', t('mercadoPago')]].map(([value, label]) => <label key={value}><input type="radio" name="payment" value={value} checked={payMethod === value} onChange={() => setPayMethod(value)} />{label}</label>)}</fieldset>
              {payMethod === 'card' && <><label>{t('cardNumber')}<input required inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" /></label><label>{t('cardName')}<input required autoComplete="cc-name" placeholder="NOMBRE APELLIDO" /></label><div className="field-row"><label>{t('expiration')}<input required placeholder="MM/AA" autoComplete="cc-exp" /></label><label>CVV<input required inputMode="numeric" placeholder="123" autoComplete="cc-csc" /></label></div></>}
              <label className="demo-control">{t('demoResult')}<select value={outcome} onChange={event => setOutcome(event.target.value as DemoOutcome)}><option value="approved">{t('approved')}</option><option value="declined">{t('declined')}</option></select><small>{t('demoHelp')}</small></label>
              <button className="button button--primary button--block" type="submit">{t('confirmPurchase')} · {formatMoney(subtotalCents + feeCents, locale)}</button>
            </form>}
          </section>
        </div>
        <aside className="order-summary">
          {hold && <div className={`hold-timer${timeLeft < 60 ? ' is-urgent' : ''}`} role="timer" aria-live="polite"><span>{timeLeft < 60 ? 'La reserva vence pronto' : 'Reserva temporal activa'}</span><b>{minutes}:{seconds}</b></div>}
          <div className="order-summary__box"><h2>{t('orderSummary')}</h2><strong>{event.title}</strong><span>{new Date(event.date).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}</span>{selectedType && <dl><div><dt>{selectedType.name} × {effectiveQuantity}</dt><dd>{formatMoney(subtotalCents, locale)}</dd></div>{seatIds.length > 0 && <div><dt>{t('seats')}</dt><dd>{seatIds.map(id => { const seat = event.seats?.find(item => item.id === id); return seat ? `${seat.row}${seat.number}` : '' }).join(', ')}</dd></div>}<div><dt>{t('serviceFee')}</dt><dd>{formatMoney(feeCents, locale)}</dd></div><div className="total"><dt>{t('total')}</dt><dd>{formatMoney(subtotalCents + feeCents, locale)}</dd></div></dl>}</div>
          <button className="button button--ghost button--block" type="button" onClick={cancelCheckout}>{t('cancelBack')}</button>
        </aside>
      </div>}
  </main>
}

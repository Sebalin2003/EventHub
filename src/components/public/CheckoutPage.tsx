import { useState, useEffect } from 'react'
import type { Event, UserProfile, TicketType, Order, Ticket } from '../../types'

type Props = {
  event: Event
  currentUser: UserProfile
  onComplete: (order: Order) => void
  onCancel: () => void
}

type Step = 'select' | 'payment' | 'processing'

const PAYMENT_METHODS = ['Tarjeta de crédito/débito', 'PayPal', 'Bizum']

function makeTickets(order: Partial<Order>, qty: number, event: Event, ticketType: TicketType, holderName: string): Ticket[] {
  return Array.from({ length: qty }).map((_, i) => ({
    id: `TKT-${Date.now()}-${i}`,
    orderId: order.id!,
    eventId: event.id,
    userId: order.userId!,
    ticketTypeId: ticketType.id,
    ticketTypeName: ticketType.name,
    qrCode: `EVENTHUB::TKT-${Date.now()}-${i}::2026`,
    status: 'activo' as const,
    eventTitle: event.title,
    eventDate: event.date,
    venueName: event.venueName,
    address: event.address ? `${event.address}, ${event.city}` : event.city,
    holderName,
  }))
}

export default function CheckoutPage({ event, currentUser, onComplete, onCancel }: Props) {
  const [step, setStep] = useState<Step>('select')
  const [selectedType, setSelectedType] = useState<TicketType | null>(null)
  const [qty, setQty] = useState(1)
  const [payMethod, setPayMethod] = useState(PAYMENT_METHODS[0])
  const [cardNum, setCardNum] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardExp, setCardExp] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [timeLeft, setTimeLeft] = useState(5 * 60) // 5 minutes
  const [timerActive, setTimerActive] = useState(false)

  useEffect(() => {
    if (!timerActive) return
    if (timeLeft <= 0) { onCancel(); return }
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [timerActive, timeLeft])

  function handleSelectContinue() {
    if (!selectedType) return
    setTimerActive(true)
    setStep('payment')
  }

  function handlePay(e: React.FormEvent) {
    e.preventDefault()
    setStep('processing')
    setTimeout(() => {
      const orderId = `ORD-${Date.now()}`
      const unitPrice = selectedType!.price
      const serviceFee = parseFloat((unitPrice * qty * 0.04).toFixed(2))
      const order: Order = {
        id: orderId,
        userId: currentUser.id,
        eventId: event.id,
        ticketTypeId: selectedType!.id,
        ticketTypeName: selectedType!.name,
        quantity: qty,
        unitPrice,
        serviceFee,
        total: parseFloat((unitPrice * qty + serviceFee).toFixed(2)),
        status: 'confirmado',
        purchasedAt: new Date().toISOString(),
        tickets: makeTickets({ id: orderId, userId: currentUser.id }, qty, event, selectedType!, currentUser.name),
      }
      onComplete(order)
    }, 2000)
  }

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const seconds = String(timeLeft % 60).padStart(2, '0')
  const subtotal = (selectedType?.price ?? 0) * qty
  const fee = parseFloat((subtotal * 0.04).toFixed(2))
  const total = subtotal + fee

  const available = event.ticketTypes.filter(t => t.sold < t.totalQuantity)

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2.5rem 2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--color-muted-foreground)', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'var(--font-body)', padding: 0 }}>← Volver</button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--color-primary)', margin: 0 }}>Checkout</h1>
      </div>

      {step === 'processing' ? (
        <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
          <div style={{ width: 60, height: 60, border: '4px solid var(--color-muted)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', margin: '0 auto 2rem', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 600, color: 'var(--color-primary)', margin: '0 0 0.5rem' }}>Procesando pago...</h2>
          <p style={{ color: 'var(--color-muted-foreground)', fontSize: '0.9rem' }}>Comunicando con la pasarela de pago. Por favor, espera.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
          {/* Left: steps */}
          <div>
            {/* Step 1: Select */}
            <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', marginBottom: '1.25rem', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: step === 'select' ? 'var(--color-secondary)' : 'var(--color-card)' }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: step !== 'select' ? 'var(--color-primary)' : 'var(--color-accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', flexShrink: 0 }}>
                  {step !== 'select' ? '✓' : '1'}
                </span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--color-primary)' }}>Seleccionar entradas</h2>
              </div>
              {step === 'select' && (
                <div style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    {available.map(tt => (
                      <div key={tt.id} onClick={() => setSelectedType(tt)} style={{
                        padding: '0.9rem 1.1rem', border: `2px solid ${selectedType?.id === tt.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius)', cursor: 'pointer', backgroundColor: selectedType?.id === tt.id ? 'var(--color-secondary)' : '#fff', transition: 'all 0.12s',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>{tt.name}</p>
                          <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: 'var(--color-muted-foreground)' }}>{tt.description}</p>
                        </div>
                        <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: tt.price === 0 ? '#1a6e2e' : 'var(--color-primary)', flexShrink: 0, marginLeft: '1rem' }}>
                          {tt.price === 0 ? 'Gratis' : `€${tt.price}`}
                        </p>
                      </div>
                    ))}
                  </div>
                  {selectedType && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cantidad</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                        <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ padding: '0.4rem 0.75rem', border: 'none', background: 'var(--color-secondary)', cursor: 'pointer', fontSize: '1rem', fontWeight: 700 }}>−</button>
                        <span style={{ padding: '0 0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{qty}</span>
                        <button onClick={() => setQty(q => Math.min(event.maxTicketsPerUser, q + 1))} style={{ padding: '0.4rem 0.75rem', border: 'none', background: 'var(--color-secondary)', cursor: 'pointer', fontSize: '1rem', fontWeight: 700 }}>+</button>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-muted-foreground)' }}>Máx. {event.maxTicketsPerUser}</span>
                    </div>
                  )}
                  <button onClick={handleSelectContinue} disabled={!selectedType} style={{ padding: '0.7rem 1.5rem', border: 'none', borderRadius: 'var(--radius)', backgroundColor: selectedType ? 'var(--color-primary)' : 'var(--color-muted)', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.875rem', cursor: selectedType ? 'pointer' : 'not-allowed' }}>
                    Continuar al pago
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Payment */}
            <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden', opacity: step === 'select' ? 0.5 : 1, pointerEvents: step === 'select' ? 'none' : 'auto' }}>
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: 'var(--color-accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', flexShrink: 0 }}>2</span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--color-primary)' }}>Método de pago</h2>
              </div>
              {step === 'payment' && (
                <form onSubmit={handlePay} style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    {PAYMENT_METHODS.map(m => (
                      <button key={m} type="button" onClick={() => setPayMethod(m)} style={{ flex: 1, padding: '0.55rem 0.5rem', border: `2px solid ${payMethod === m ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: 'var(--radius)', backgroundColor: payMethod === m ? 'var(--color-secondary)' : '#fff', fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: payMethod === m ? 600 : 400, cursor: 'pointer' }}>{m}</button>
                    ))}
                  </div>
                  {payMethod === 'Tarjeta de crédito/débito' && (
                    <div style={{ display: 'grid', gap: '0.9rem', marginBottom: '1.25rem' }}>
                      <div>
                        <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', marginBottom: '0.35rem' }}>Número de tarjeta</label>
                        <input value={cardNum} onChange={e => setCardNum(e.target.value)} placeholder="1234 5678 9012 3456" required maxLength={19}
                          style={{ width: '100%', padding: '0.6rem 0.85rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', marginBottom: '0.35rem' }}>Nombre en la tarjeta</label>
                        <input value={cardName} onChange={e => setCardName(e.target.value)} placeholder="NOMBRE APELLIDO" required
                          style={{ width: '100%', padding: '0.6rem 0.85rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', marginBottom: '0.35rem' }}>Caducidad</label>
                          <input value={cardExp} onChange={e => setCardExp(e.target.value)} placeholder="MM/AA" required maxLength={5}
                            style={{ width: '100%', padding: '0.6rem 0.85rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', marginBottom: '0.35rem' }}>CVV</label>
                          <input value={cardCvv} onChange={e => setCardCvv(e.target.value)} placeholder="123" required maxLength={4}
                            style={{ width: '100%', padding: '0.6rem 0.85rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <button type="submit" style={{ width: '100%', padding: '0.85rem', border: 'none', borderRadius: 'var(--radius)', backgroundColor: 'var(--color-accent)', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>
                    Confirmar compra · €{total.toFixed(2)}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right: summary */}
          <div style={{ position: 'sticky', top: 80 }}>
            {/* Timer */}
            {timerActive && (
              <div style={{ backgroundColor: timeLeft < 60 ? '#fde8e8' : 'var(--color-secondary)', border: `1px solid ${timeLeft < 60 ? '#f5c2c7' : 'var(--color-border)'}`, borderRadius: 'var(--radius)', padding: '0.85rem 1.25rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.82rem', color: timeLeft < 60 ? '#a02020' : 'var(--color-foreground)', fontWeight: 500 }}>
                  {timeLeft < 60 ? '¡Reserva a punto de expirar!' : 'Reserva temporal activa'}
                </p>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: timeLeft < 60 ? '#a02020' : 'var(--color-primary)' }}>{minutes}:{seconds}</span>
              </div>
            )}

            <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--color-primary)' }}>Resumen del pedido</h3>
              </div>
              <div style={{ padding: '1.1rem 1.25rem' }}>
                {event.imageUrl && <img src={event.imageUrl} alt={event.title} style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 2, marginBottom: '0.85rem' }} />}
                <p style={{ margin: '0 0 0.25rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-foreground)' }}>{event.title}</p>
                <p style={{ margin: '0 0 1rem', fontSize: '0.78rem', color: 'var(--color-muted-foreground)' }}>
                  {new Date(event.date).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })} · {event.city}
                </p>
                {selectedType && (
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                      <span>{selectedType.name} × {qty}</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>€{(selectedType.price * qty).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.82rem', color: 'var(--color-muted-foreground)' }}>
                      <span>Cargo de servicio (4%)</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>€{fee.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--color-foreground)', paddingTop: '0.75rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Total</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary)' }}>€{total.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


import { useState } from 'react'
import type { Event, Order, CheckInRecord, UserProfile } from '../../types'
import BrandLogo from '../shared/BrandLogo'

type Props = {
  events: Event[]
  orders: Order[]
  currentUser: UserProfile
  checkIns: CheckInRecord[]
  onCheckIn: (record: CheckInRecord) => void
  onLogout: () => void
}

const RESULT_META: Record<CheckInRecord['result'], { label: string; bg: string; color: string; icon: string }> = {
  ENTRADA_VALIDA: { label: 'Entrada válida', bg: '#e6f4ea', color: '#1a6e2e', icon: '✓' },
  ENTRADA_YA_UTILIZADA: { label: 'Entrada ya utilizada', bg: '#fff3cd', color: '#7d5c00', icon: '⚠' },
  ENTRADA_INVALIDA: { label: 'Entrada inválida', bg: '#fde8e8', color: '#a02020', icon: '✕' },
  ENTRADA_EVENTO_INCORRECTO: { label: 'Evento incorrecto', bg: '#fde8e8', color: '#a02020', icon: '✕' },
}

export default function StaffPortal({ events, orders, currentUser, checkIns, onCheckIn, onLogout }: Props) {
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [scanInput, setScanInput] = useState('')
  const [lastResult, setLastResult] = useState<(CheckInRecord & { flash: boolean }) | null>(null)

  const published = events.filter(e => e.status === 'publicado')
  const ev = published.find(e => e.id === selectedEventId)
  const allTickets = orders.flatMap(o => o.tickets)
  const eventTickets = allTickets.filter(ticket => ticket.eventId === selectedEventId)
  const checkedInIds = new Set(checkIns.filter(c => c.result === 'ENTRADA_VALIDA').map(c => c.ticketId))

  function handleScan(e: React.FormEvent) {
    e.preventDefault()
    const code = scanInput.trim()
    if (!code || !selectedEventId) return

    const ticket = allTickets.find(t => t.id === code || t.qrCode === code)
    let result: CheckInRecord['result']
    let attendeeName = 'Desconocido'
    let ticketType = '—'

    if (!ticket) {
      result = 'ENTRADA_INVALIDA'
    } else if (ticket.eventId !== selectedEventId) {
      result = 'ENTRADA_EVENTO_INCORRECTO'
      attendeeName = ticket.holderName
      ticketType = ticket.ticketTypeName
    } else if (ticket.status === 'usado' || checkedInIds.has(ticket.id)) {
      result = 'ENTRADA_YA_UTILIZADA'
      attendeeName = ticket.holderName
      ticketType = ticket.ticketTypeName
    } else {
      result = 'ENTRADA_VALIDA'
      attendeeName = ticket.holderName
      ticketType = ticket.ticketTypeName
    }

    const record: CheckInRecord = {
      id: `ci${Date.now()}`,
      ticketId: ticket?.id ?? code,
      eventId: selectedEventId,
      attendeeName,
      ticketType,
      checkedInAt: new Date().toISOString(),
      result,
    }
    onCheckIn({ ...record, operatorId: currentUser.id })
    setLastResult({ ...record, flash: true })
    setScanInput('')
    setTimeout(() => setLastResult(null), 5000)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-primary)', fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <BrandLogo subtitle="Staff" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'rgba(245,243,238,0.65)' }}>{currentUser.name}</span>
          <button onClick={onLogout} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 2, padding: '0.3rem 0.7rem', color: 'rgba(245,243,238,0.65)', fontFamily: 'var(--font-body)', fontSize: '0.75rem', cursor: 'pointer' }}>Salir</button>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1.25rem' }}>
        {/* Select event */}
        {!selectedEventId ? (
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 600, letterSpacing: '-0.02em', color: '#F5F3EE', margin: '0 0 0.5rem' }}>Seleccionar evento</h1>
            <p style={{ color: 'rgba(245,243,238,0.55)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>Elige el evento en el que realizarás el control de acceso.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {published.map(ev => (
                <button key={ev.id} onClick={() => setSelectedEventId(ev.id)} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem',
                  backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.14)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: '#F5F3EE' }}>{ev.title}</p>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: 'rgba(245,243,238,0.5)' }}>{new Date(ev.date).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })} · {ev.city}</p>
                  </div>
                  <span style={{ color: 'var(--color-accent)', fontSize: '1.2rem' }}>→</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {/* Event header */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <button onClick={() => { setSelectedEventId(''); setLastResult(null) }} style={{ background: 'none', border: 'none', color: 'rgba(245,243,238,0.5)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', cursor: 'pointer', padding: 0, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>← Cambiar evento</button>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 600, letterSpacing: '-0.02em', color: '#F5F3EE', margin: 0, lineHeight: 1.2 }}>{ev?.title}</h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'rgba(245,243,238,0.5)' }}>{ev?.venueName} · {ev?.city}</p>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius)', padding: '1.1rem', textAlign: 'center' }}>
                <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 700, color: '#7EDEA0', lineHeight: 1 }}>{checkedInIds.size}</p>
                <p style={{ margin: '0.3rem 0 0', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(245,243,238,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ingresados</p>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius)', padding: '1.1rem', textAlign: 'center' }}>
                <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 700, color: '#F5F3EE', lineHeight: 1 }}>{eventTickets.length}</p>
                <p style={{ margin: '0.3rem 0 0', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(245,243,238,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</p>
              </div>
            </div>

            {/* Last result feedback */}
            {lastResult && (() => {
              const meta = RESULT_META[lastResult.result]
              return (
                <div style={{ backgroundColor: meta.bg, border: `2px solid ${meta.color}`, borderRadius: 'var(--radius)', padding: '1.25rem', textAlign: 'center', marginBottom: '1.25rem' }}>
                  <p style={{ margin: 0, fontSize: '2.5rem', lineHeight: 1 }}>{meta.icon}</p>
                  <p style={{ margin: '0.4rem 0 0.1rem', fontWeight: 800, fontSize: '1.1rem', color: meta.color }}>{meta.label}</p>
                  {lastResult.attendeeName !== 'Desconocido' && <p style={{ margin: 0, fontSize: '0.875rem', color: meta.color, fontWeight: 600 }}>{lastResult.attendeeName}</p>}
                  {lastResult.ticketType !== '—' && <p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: meta.color, opacity: 0.8 }}>{lastResult.ticketType}</p>}
                </div>
              )
            })()}

            {/* Scanner input */}
            <form onSubmit={handleScan} style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(245,243,238,0.5)', marginBottom: '0.5rem' }}>Escanear código QR o introducir ID</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input value={scanInput} onChange={e => setScanInput(e.target.value)}
                  placeholder="TKT-xxx..."
                  autoFocus
                  style={{ flex: 1, padding: '0.85rem 1rem', border: 'none', borderRadius: 'var(--radius)', fontFamily: 'var(--font-mono)', fontSize: '1rem', outline: 'none', backgroundColor: 'rgba(255,255,255,0.12)', color: '#F5F3EE' }} />
                <button type="submit" style={{ padding: '0.85rem 1.1rem', border: 'none', borderRadius: 'var(--radius)', backgroundColor: 'var(--color-accent)', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Validar
                </button>
              </div>
            </form>

            {/* Recent log */}
            {checkIns.length > 0 && (
              <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <p style={{ margin: 0, padding: '0.6rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(245,243,238,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Últimos accesos</p>
                {[...checkIns].reverse().slice(0, 5).map(ci => (
                  <div key={ci.id} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#F5F3EE' }}>{ci.attendeeName}</p>
                      <p style={{ margin: '0.1rem 0 0', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'rgba(245,243,238,0.4)' }}>{ci.ticketId}</p>
                    </div>
                    <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#7EDEA0' }}>{new Date(ci.checkedInAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

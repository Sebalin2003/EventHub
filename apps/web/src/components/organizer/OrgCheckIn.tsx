import { useState } from 'react'
import type { Event, Order, CheckInRecord } from '../../types'

type Props = { events: Event[]; orders: Order[] }

export default function OrgCheckIn({ events, orders }: Props) {
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? '')
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([])
  const [scanInput, setScanInput] = useState('')
  const [lastResult, setLastResult] = useState<{ code: string; result: CheckInRecord['result']; name?: string } | null>(null)

  const ev = events.find(e => e.id === selectedEventId)
  const allTickets = orders.filter(o => o.eventId === selectedEventId).flatMap(o => o.tickets)
  const checkedInIds = new Set(checkIns.filter(c => c.result === 'ENTRADA_VALIDA').map(c => c.ticketId))

  function handleScan(e: React.FormEvent) {
    e.preventDefault()
    const code = scanInput.trim()
    if (!code) return

    // Find ticket by ID or QR
    const ticket = allTickets.find(t => t.id === code || t.qrCode === code || t.id === code.replace('EVENTHUB::', '').split('::')[0])
    let result: CheckInRecord['result']
    let name: string | undefined

    if (!ticket) {
      result = 'ENTRADA_INVALIDA'
    } else if (ticket.eventId !== selectedEventId) {
      result = 'ENTRADA_EVENTO_INCORRECTO'
      name = ticket.holderName
    } else if (checkedInIds.has(ticket.id) || ticket.status === 'usado') {
      result = 'ENTRADA_YA_UTILIZADA'
      name = ticket.holderName
    } else {
      result = 'ENTRADA_VALIDA'
      name = ticket.holderName
      setCheckIns(prev => [...prev, {
        id: `ci${Date.now()}`,
        ticketId: ticket.id,
        eventId: selectedEventId,
        attendeeName: ticket.holderName,
        ticketType: ticket.ticketTypeName,
        checkedInAt: new Date().toISOString(),
        result: 'ENTRADA_VALIDA',
      }])
    }

    setLastResult({ code, result, name })
    setScanInput('')
    setTimeout(() => setLastResult(null), 4000)
  }

  const RESULT_META: Record<CheckInRecord['result'], { label: string; bg: string; color: string; border: string }> = {
    ENTRADA_VALIDA: { label: 'Entrada válida ✓', bg: '#e6f4ea', color: '#1a6e2e', border: '#1a6e2e' },
    ENTRADA_YA_UTILIZADA: { label: 'Entrada ya utilizada', bg: '#fff3cd', color: '#7d5c00', border: '#cc9a00' },
    ENTRADA_INVALIDA: { label: 'Entrada inválida', bg: '#fde8e8', color: '#a02020', border: '#a02020' },
    ENTRADA_EVENTO_INCORRECTO: { label: 'Evento incorrecto', bg: '#fde8e8', color: '#a02020', border: '#a02020' },
  }

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--color-primary)', margin: '0 0 2rem' }}>Check-in</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Scanner */}
        <div>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', marginBottom: '0.4rem' }}>Evento</label>
            <select value={selectedEventId} onChange={e => { setSelectedEventId(e.target.value); setCheckIns([]); setLastResult(null) }}
              style={{ width: '100%', padding: '0.6rem 0.85rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}>
              {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
          </div>

          {/* Simulated scanner */}
          <div style={{ backgroundColor: 'var(--color-primary)', borderRadius: 'var(--radius)', padding: '2rem', textAlign: 'center', marginBottom: '1.25rem' }}>
            <div style={{ width: 140, height: 140, border: '3px solid rgba(245,243,238,0.3)', borderRadius: 4, margin: '0 auto 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: 'var(--color-accent)', animation: 'scanline 2s linear infinite', top: '50%' }} />
              <style>{`@keyframes scanline { 0%,100%{top:10%} 50%{top:90%} }`}</style>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(245,243,238,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Listo para escanear</span>
            </div>
            <p style={{ color: 'rgba(245,243,238,0.6)', fontSize: '0.8rem', margin: '0 0 1rem', fontFamily: 'var(--font-mono)' }}>Introduce el ID o código QR</p>
            <form onSubmit={handleScan} style={{ display: 'flex', gap: '0.5rem' }}>
              <input value={scanInput} onChange={e => setScanInput(e.target.value)} placeholder="TKT-xxx o código QR..."
                style={{ flex: 1, padding: '0.6rem 0.85rem', border: 'none', borderRadius: 'var(--radius)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', outline: 'none' }} autoFocus />
              <button type="submit" style={{ padding: '0.6rem 1rem', border: 'none', borderRadius: 'var(--radius)', backgroundColor: 'var(--color-accent)', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Validar</button>
            </form>
          </div>

          {/* Last result */}
          {lastResult && (() => {
            const meta = RESULT_META[lastResult.result]
            return (
              <div style={{ backgroundColor: meta.bg, border: `2px solid ${meta.border}`, borderRadius: 'var(--radius)', padding: '1.1rem 1.25rem' }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: meta.color }}>{meta.label}</p>
                {lastResult.name && <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem', color: meta.color }}>{lastResult.name}</p>}
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: meta.color, opacity: 0.75, fontFamily: 'var(--font-mono)' }}>{lastResult.code}</p>
              </div>
            )
          })()}

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
            <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '1rem', textAlign: 'center' }}>
              <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: '#1a6e2e' }}>{checkedInIds.size}</p>
              <p style={{ margin: '0.2rem 0 0', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ingresados</p>
            </div>
            <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '1rem', textAlign: 'center' }}>
              <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>{allTickets.length}</p>
              <p style={{ margin: '0.2rem 0 0', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total entradas</p>
            </div>
          </div>
        </div>

        {/* Log */}
        <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--color-primary)' }}>Registro de validaciones</h3>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-muted-foreground)' }}>{checkIns.length} acciones</span>
          </div>
          <div style={{ maxHeight: 440, overflowY: 'auto' }}>
            {checkIns.length === 0 ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-muted-foreground)', fontStyle: 'italic', fontSize: '0.875rem' }}>Sin validaciones aún.</p>
            ) : [...checkIns].reverse().map(ci => {
              const meta = RESULT_META[ci.result]
              return (
                <div key={ci.id} style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>{ci.attendeeName}</p>
                    <p style={{ margin: '0.1rem 0 0', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-muted-foreground)' }}>{ci.ticketId} · {ci.ticketType}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ backgroundColor: meta.bg, color: meta.color, fontSize: '0.65rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', padding: '0.15rem 0.5rem', borderRadius: 2 }}>{meta.label}</span>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.7rem', color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-mono)' }}>{new Date(ci.checkedInAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}


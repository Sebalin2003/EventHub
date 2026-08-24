import { useState } from 'react'
import type { Event, Order } from '../../types'

type Props = { events: Event[]; orders: Order[] }

export default function OrgAttendees({ events, orders }: Props) {
  const [filterEvent, setFilterEvent] = useState('todos')
  const [search, setSearch] = useState('')

  const allTickets = orders.flatMap(o => o.tickets.map(t => ({ ...t, orderStatus: o.status })))
  const filtered = allTickets.filter(t => {
    const matchEvent = filterEvent === 'todos' || t.eventId === filterEvent
    const matchSearch = t.holderName.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase())
    return matchEvent && matchSearch
  })

  function getEventTitle(id: string) { return events.find(e => e.id === id)?.title ?? '—' }

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--color-primary)', margin: '0 0 2rem' }}>Asistentes</h1>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <input type="text" placeholder="Buscar por nombre o ticket..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '0.55rem 0.85rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', outline: 'none' }} />
        <select value={filterEvent} onChange={e => setFilterEvent(e.target.value)} style={{ padding: '0.55rem 0.85rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', cursor: 'pointer', maxWidth: 260 }}>
          <option value="todos">Todos los eventos</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
        </select>
      </div>
      <p style={{ color: 'var(--color-muted-foreground)', fontSize: '0.85rem', marginBottom: '1rem' }}>{filtered.length} asistentes</p>
      <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-secondary)' }}>
              {['Ticket ID', 'Titular', 'Evento', 'Tipo', 'Estado', 'Usado'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-muted-foreground)', fontStyle: 'italic' }}>Sin asistentes.</td></tr>
            ) : filtered.map(t => {
              const stMeta: Record<string, { bg: string; color: string }> = {
                activo: { bg: '#e6f4ea', color: '#1a6e2e' },
                usado: { bg: '#e8edf5', color: '#1B2A4A' },
                cancelado: { bg: '#fde8e8', color: '#a02020' },
              }
              const sm = stMeta[t.status] ?? { bg: '#eee', color: '#333' }
              return (
                <tr key={t.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.85rem 1.25rem' }}><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', backgroundColor: 'var(--color-secondary)', color: 'var(--color-primary)', padding: '0.2rem 0.5rem', borderRadius: 2 }}>{t.id}</span></td>
                  <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.85rem', fontWeight: 500 }}>{t.holderName}</td>
                  <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.82rem', color: 'var(--color-muted-foreground)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getEventTitle(t.eventId)}</td>
                  <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.82rem' }}>{t.ticketTypeName}</td>
                  <td style={{ padding: '0.85rem 1.25rem' }}><span style={{ backgroundColor: sm.bg, color: sm.color, fontSize: '0.68rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', padding: '0.15rem 0.5rem', borderRadius: 2 }}>{t.status}</span></td>
                  <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.78rem', color: 'var(--color-muted-foreground)' }}>{t.usedAt ? new Date(t.usedAt).toLocaleDateString('es') : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}


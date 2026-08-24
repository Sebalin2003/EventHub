import { useState } from 'react'
import type { Attendee, Event } from '../types'

type Props = {
  attendees: Attendee[]
  events: Event[]
}

const STATUS_META = {
  confirmado: { label: 'Confirmado', bg: '#e6f4ea', color: '#1a6e2e' },
  pendiente: { label: 'Pendiente', bg: '#fff3cd', color: '#7d5c00' },
  cancelado: { label: 'Cancelado', bg: '#fde8e8', color: '#a02020' },
}

export default function Attendees({ attendees, events }: Props) {
  const [search, setSearch] = useState('')
  const [filterEvent, setFilterEvent] = useState<string>('todos')
  const [filterStatus, setFilterStatus] = useState<string>('todos')

  const filtered = attendees.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()) || a.ticket.toLowerCase().includes(search.toLowerCase())
    const matchEvent = filterEvent === 'todos' || a.eventId === filterEvent
    const matchStatus = filterStatus === 'todos' || a.status === filterStatus
    return matchSearch && matchEvent && matchStatus
  })

  function getEventTitle(id: string) {
    return events.find(e => e.id === id)?.title ?? '—'
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--color-primary)', margin: 0 }}>Asistentes</h1>
        <p style={{ color: 'var(--color-muted-foreground)', marginTop: '0.35rem', fontSize: '0.9rem' }}>{filtered.length} de {attendees.length} registros</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
        {(['confirmado', 'pendiente', 'cancelado'] as const).map(s => {
          const count = attendees.filter(a => a.status === s).length
          const meta = STATUS_META[s]
          return (
            <div key={s} onClick={() => setFilterStatus(filterStatus === s ? 'todos' : s)} style={{ backgroundColor: 'var(--color-card)', border: `1px solid ${filterStatus === s ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: 'var(--radius)', padding: '1.25rem 1.5rem', cursor: 'pointer', transition: 'border-color 0.15s' }}>
              <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)' }}>{meta.label}</p>
              <p style={{ margin: '0.4rem 0 0', fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.03em', color: meta.color }}>{count}</p>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Buscar por nombre, email o ticket..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: '1 1 220px', padding: '0.55rem 0.85rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', outline: 'none' }}
        />
        <select value={filterEvent} onChange={e => setFilterEvent(e.target.value)} style={{ padding: '0.55rem 0.85rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', cursor: 'pointer', maxWidth: 260 }}>
          <option value="todos">Todos los eventos</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '0.55rem 0.85rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', cursor: 'pointer' }}>
          <option value="todos">Todos los estados</option>
          <option value="confirmado">Confirmado</option>
          <option value="pendiente">Pendiente</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-secondary)' }}>
              {['Ticket', 'Asistente', 'Evento', 'Registro', 'Estado'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>No se encontraron asistentes.</td></tr>
            ) : filtered.map(a => {
              const sm = STATUS_META[a.status]
              const regDate = new Date(a.registeredAt)
              return (
                <tr key={a.id} style={{ borderTop: '1px solid var(--color-border)', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5F3EE')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', backgroundColor: 'var(--color-secondary)', color: 'var(--color-primary)', padding: '0.2rem 0.55rem', borderRadius: 2 }}>{a.ticket}</span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>{a.name}</p>
                    <p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: 'var(--color-muted-foreground)' }}>{a.email}</p>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.83rem', color: 'var(--color-muted-foreground)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getEventTitle(a.eventId)}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', whiteSpace: 'nowrap' }}>
                    <p style={{ margin: 0, fontSize: '0.83rem' }}>{regDate.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    <p style={{ margin: '0.1rem 0 0', fontSize: '0.73rem', color: 'var(--color-muted-foreground)' }}>{regDate.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</p>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ backgroundColor: sm.bg, color: sm.color, padding: '0.2rem 0.55rem', borderRadius: 2, fontSize: '0.72rem', fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>{sm.label}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}


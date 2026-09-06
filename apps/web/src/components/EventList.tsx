import { useState } from 'react'
import type { Event, EventCategory, EventStatus } from '../types'

type Props = {
  events: Event[]
  onEdit: (ev: Event) => void
  onDelete: (id: string) => void
  onNew: () => void
}

const STATUS_META: Record<EventStatus, { label: string; bg: string; color: string }> = {
  publicado: { label: 'Publicado', bg: '#e6f4ea', color: '#1a6e2e' },
  borrador: { label: 'Borrador', bg: '#fff3cd', color: '#7d5c00' },
  cancelado: { label: 'Cancelado', bg: '#fde8e8', color: '#a02020' },
  finalizado: { label: 'Finalizado', bg: '#e8edf5', color: '#1B2A4A' },
}

const CAT_LABELS: Record<EventCategory, string> = {
  conferencia: 'Conferencia',
  taller: 'Taller',
  networking: 'Networking',
  webinar: 'Webinar',
  concierto: 'Concierto',
  exposición: 'Exposición',
}

export default function EventList({ events, onEdit, onDelete, onNew }: Props) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<EventStatus | 'todos'>('todos')
  const [filterCat, setFilterCat] = useState<EventCategory | 'todos'>('todos')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const filtered = events.filter(ev => {
    const matchSearch = ev.title.toLowerCase().includes(search.toLowerCase()) || ev.location.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'todos' || ev.status === filterStatus
    const matchCat = filterCat === 'todos' || ev.category === filterCat
    return matchSearch && matchStatus && matchCat
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--color-primary)', margin: 0 }}>Eventos</h1>
          <p style={{ color: 'var(--color-muted-foreground)', marginTop: '0.35rem', fontSize: '0.9rem' }}>{filtered.length} de {events.length} eventos</p>
        </div>
        <button onClick={onNew} style={{ backgroundColor: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '0.6rem 1.25rem', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
          + Nuevo Evento
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Buscar eventos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: '1 1 200px', padding: '0.55rem 0.85rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', outline: 'none' }}
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as EventStatus | 'todos')} style={{ padding: '0.55rem 0.85rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', cursor: 'pointer' }}>
          <option value="todos">Todos los estados</option>
          <option value="publicado">Publicado</option>
          <option value="borrador">Borrador</option>
          <option value="cancelado">Cancelado</option>
          <option value="finalizado">Finalizado</option>
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value as EventCategory | 'todos')} style={{ padding: '0.55rem 0.85rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', cursor: 'pointer' }}>
          <option value="todos">Todas las categorías</option>
          {Object.entries(CAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-secondary)' }}>
              {['Evento', 'Fecha', 'Ubicación', 'Asistentes', 'Precio', 'Estado', ''].map(h => (
                <th key={h} style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>No hay eventos que coincidan con la búsqueda.</td></tr>
            ) : filtered.map((ev, i) => {
              const d = new Date(ev.date)
              const pct = Math.round((ev.registered / ev.capacity) * 100)
              const sm = STATUS_META[ev.status]
              return (
                <tr key={ev.id} style={{ borderTop: '1px solid var(--color-border)', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5F3EE')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}>
                  <td style={{ padding: '1rem 1.25rem', maxWidth: 260 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</p>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.73rem', color: 'var(--color-muted-foreground)' }}>{CAT_LABELS[ev.category]}</p>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', whiteSpace: 'nowrap' }}>
                    <p style={{ margin: 0, fontSize: '0.83rem' }}>{d.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    <p style={{ margin: '0.1rem 0 0', fontSize: '0.73rem', color: 'var(--color-muted-foreground)' }}>{d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</p>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.83rem', color: 'var(--color-muted-foreground)', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.location}</td>
                  <td style={{ padding: '1rem 1.25rem', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 52, height: 4, backgroundColor: 'var(--color-muted)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: pct > 90 ? 'var(--color-accent)' : 'var(--color-primary)', borderRadius: 2 }} />
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-muted-foreground)' }}>{ev.registered}/{ev.capacity}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.83rem', whiteSpace: 'nowrap' }}>
                    {ev.price === 0 ? <span style={{ color: '#1a6e2e' }}>Gratis</span> : `ARS ${ev.price.toLocaleString('es-AR')}`}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ backgroundColor: sm.bg, color: sm.color, padding: '0.2rem 0.55rem', borderRadius: 2, fontSize: '0.72rem', fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>{sm.label}</span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => onEdit(ev)} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '0.3rem 0.65rem', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--color-foreground)', fontFamily: 'var(--font-body)' }}>Editar</button>
                      {confirmDelete === ev.id ? (
                        <button onClick={() => { onDelete(ev.id); setConfirmDelete(null) }} style={{ background: '#a02020', border: 'none', borderRadius: 'var(--radius)', padding: '0.3rem 0.65rem', cursor: 'pointer', fontSize: '0.75rem', color: '#fff', fontFamily: 'var(--font-body)' }}>¿Confirmar?</button>
                      ) : (
                        <button onClick={() => setConfirmDelete(ev.id)} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '0.3rem 0.65rem', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-body)' }}>Eliminar</button>
                      )}
                    </div>
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

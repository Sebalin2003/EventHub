import { useState } from 'react'
import type { Event } from '../../types'

type Props = {
  events: Event[]
  onEdit: (ev: Event) => void
  onDelete: (id: string) => void
  onNew: () => void
}

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  publicado: { label: 'Publicado', bg: '#e6f4ea', color: '#1a6e2e' },
  borrador: { label: 'Borrador', bg: '#fff3cd', color: '#7d5c00' },
  cancelado: { label: 'Cancelado', bg: '#fde8e8', color: '#a02020' },
  finalizado: { label: 'Finalizado', bg: '#e8edf5', color: '#1B2A4A' },
}

export default function OrgEvents({ events, onEdit, onDelete, onNew }: Props) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--color-primary)', margin: 0 }}>Mis eventos</h1>
          <p style={{ color: 'var(--color-muted-foreground)', marginTop: '0.35rem', fontSize: '0.875rem' }}>{events.length} eventos</p>
        </div>
        <button onClick={onNew} style={{ backgroundColor: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '0.6rem 1.25rem', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>+ Nuevo evento</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-muted-foreground)' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.4rem', margin: 0 }}>Aún no tienes eventos.</p>
            <button onClick={onNew} style={{ marginTop: '1rem', backgroundColor: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '0.6rem 1.25rem', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Crear tu primer evento</button>
          </div>
        ) : events.map(ev => {
          const sm = STATUS_META[ev.status]
          const fill = Math.round((ev.registered / ev.capacity) * 100)
          const revenue = ev.ticketTypes.reduce((s, t) => s + t.price * t.sold, 0)
          return (
            <div key={ev.id} style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', display: 'grid', gridTemplateColumns: '160px 1fr auto', overflow: 'hidden' }}>
              {ev.imageUrl ? (
                <div style={{ height: '100%', minHeight: 90, overflow: 'hidden', backgroundColor: '#ccc' }}>
                  <img src={ev.imageUrl} alt={ev.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : <div style={{ backgroundColor: 'var(--color-secondary)' }} />}
              <div style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                  <span style={{ backgroundColor: sm.bg, color: sm.color, fontSize: '0.68rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', padding: '0.15rem 0.5rem', borderRadius: 2 }}>{sm.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-muted-foreground)' }}>{new Date(ev.date).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <h3 style={{ margin: '0 0 0.35rem', fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--color-primary)' }}>{ev.title}</h3>
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.78rem', color: 'var(--color-muted-foreground)' }}>{ev.venueName}, {ev.city}</p>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div>
                    <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Vendidos</p>
                    <p style={{ margin: '0.1rem 0 0', fontWeight: 600, fontSize: '0.85rem' }}>{ev.registered}/{ev.capacity} <span style={{ fontSize: '0.75rem', color: fill > 90 ? 'var(--color-accent)' : 'var(--color-muted-foreground)' }}>({fill}%)</span></p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ingresos</p>
                    <p style={{ margin: '0.1rem 0 0', fontWeight: 600, fontSize: '0.85rem' }}>€{revenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tipos</p>
                    <p style={{ margin: '0.1rem 0 0', fontWeight: 600, fontSize: '0.85rem' }}>{ev.ticketTypes.length}</p>
                  </div>
                </div>
              </div>
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center', borderLeft: '1px solid var(--color-border)' }}>
                <button onClick={() => onEdit(ev)} style={{ padding: '0.45rem 1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>Editar</button>
                {confirmDelete === ev.id ? (
                  <button onClick={() => { onDelete(ev.id); setConfirmDelete(null) }} style={{ padding: '0.45rem 1rem', border: 'none', borderRadius: 'var(--radius)', backgroundColor: '#a02020', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>¿Confirmar?</button>
                ) : (
                  <button onClick={() => setConfirmDelete(ev.id)} style={{ padding: '0.45rem 1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--color-muted-foreground)', whiteSpace: 'nowrap' }}>Eliminar</button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


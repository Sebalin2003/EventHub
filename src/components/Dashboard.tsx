import type { Event, Attendee } from '../types'

type Props = {
  events: Event[]
  attendees: Attendee[]
  onNew: () => void
  onNavigate: (tab: 'dashboard' | 'events' | 'create' | 'attendees') => void
}

const CAT_LABELS: Record<string, string> = {
  conferencia: 'Conferencia',
  taller: 'Taller',
  networking: 'Networking',
  webinar: 'Webinar',
  concierto: 'Concierto',
  exposición: 'Exposición',
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  publicado: { bg: '#e6f4ea', color: '#1e7e34' },
  borrador: { bg: '#fff3cd', color: '#856404' },
  cancelado: { bg: '#fde8e8', color: '#b02a37' },
  finalizado: { bg: '#e8edf5', color: '#1B2A4A' },
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
      backgroundColor: 'var(--color-card)',
      border: '1px solid var(--color-border)',
      padding: '1.5rem',
      borderRadius: 'var(--radius)',
    }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', margin: 0 }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--color-primary)', margin: '0.5rem 0 0.25rem' }}>{value}</p>
      {sub && <p style={{ fontSize: '0.78rem', color: 'var(--color-muted-foreground)', margin: 0 }}>{sub}</p>}
    </div>
  )
}

export default function Dashboard({ events, attendees, onNew, onNavigate }: Props) {
  const total = events.length
  const published = events.filter(e => e.status === 'publicado').length
  const totalAttendees = attendees.filter(a => a.status === 'confirmado').length
  const revenue = events.reduce((sum, e) => sum + e.price * e.registered, 0)

  const upcoming = [...events]
    .filter(e => e.status === 'publicado')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4)

  const fillPct = (e: Event) => Math.round((e.registered / e.capacity) * 100)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--color-primary)', margin: 0 }}>
            Panel de Control
          </h1>
          <p style={{ color: 'var(--color-muted-foreground)', marginTop: '0.35rem', fontSize: '0.9rem' }}>
            Agosto 2026 — resumen general
          </p>
        </div>
        <button onClick={onNew} style={{
          backgroundColor: 'var(--color-accent)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--radius)',
          padding: '0.6rem 1.25rem',
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          fontSize: '0.85rem',
          cursor: 'pointer',
          letterSpacing: '0.02em',
        }}>
          + Nuevo Evento
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
        <StatCard label="Total eventos" value={total} sub={`${published} publicados`} />
        <StatCard label="Asistentes confirmados" value={totalAttendees.toLocaleString()} sub="en todos los eventos" />
        <StatCard label="Ocupación media" value={`${Math.round(events.reduce((s, e) => s + fillPct(e), 0) / (events.length || 1))}%`} sub="de capacidad total" />
        <StatCard label="Ingresos estimados" value={`€${revenue.toLocaleString()}`} sub="todos los eventos" />
      </div>

      {/* Two columns: upcoming + activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem' }}>
        {/* Upcoming events */}
        <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, margin: 0, color: 'var(--color-primary)' }}>Próximos eventos</h2>
            <button onClick={() => onNavigate('events')} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontFamily: 'var(--font-body)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 500 }}>Ver todos →</button>
          </div>
          <div>
            {upcoming.map((ev, i) => {
              const d = new Date(ev.date)
              const pct = fillPct(ev)
              return (
                <div key={ev.id} style={{
                  padding: '1rem 1.5rem',
                  borderBottom: i < upcoming.length - 1 ? '1px solid var(--color-border)' : 'none',
                  display: 'grid',
                  gridTemplateColumns: '2.5rem 1fr auto',
                  gap: '1rem',
                  alignItems: 'center',
                }}>
                  <div style={{ textAlign: 'center', backgroundColor: 'var(--color-secondary)', borderRadius: 2, padding: '0.35rem 0' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-muted-foreground)', textTransform: 'uppercase' }}>
                      {d.toLocaleDateString('es', { month: 'short' })}
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1 }}>
                      {d.getDate()}
                    </div>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-foreground)' }}>{ev.title}</p>
                    <p style={{ margin: '0.15rem 0 0.5rem', fontSize: '0.75rem', color: 'var(--color-muted-foreground)' }}>{ev.location}</p>
                    <div style={{ height: 4, backgroundColor: 'var(--color-muted)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: pct > 90 ? 'var(--color-accent)' : 'var(--color-primary)', borderRadius: 2, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-primary)' }}>{pct}%</p>
                    <p style={{ margin: '0.1rem 0 0', fontSize: '0.7rem', color: 'var(--color-muted-foreground)' }}>{ev.registered}/{ev.capacity}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Category breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '1.25rem 1.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, margin: '0 0 1rem', color: 'var(--color-primary)' }}>Por categoría</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {Object.entries(
                events.reduce<Record<string, number>>((acc, e) => ({ ...acc, [e.category]: (acc[e.category] ?? 0) + 1 }), {})
              ).map(([cat, count]) => (
                <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.825rem', color: 'var(--color-foreground)' }}>{CAT_LABELS[cat] ?? cat}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 500, backgroundColor: 'var(--color-secondary)', color: 'var(--color-primary)', padding: '0.15rem 0.5rem', borderRadius: 2 }}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--color-primary)', borderRadius: 'var(--radius)', padding: '1.5rem', color: 'var(--color-primary-foreground)' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(245,243,238,0.5)', margin: '0 0 0.5rem' }}>Asistentes por estado</p>
            {(['confirmado', 'pendiente', 'cancelado'] as const).map(s => {
              const count = attendees.filter(a => a.status === s).length
              return (
                <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{ fontSize: '0.825rem', textTransform: 'capitalize' }}>{s}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: s === 'confirmado' ? '#7EDEA0' : s === 'cancelado' ? '#FF8A8A' : '#FFD580' }}>{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}


import { useState } from 'react'
import type { Event, EventCategory } from '../../types'

type Props = {
  events: Event[]
  onViewEvent: (ev: Event) => void
  onExplore: () => void
  onSearch: (q: string) => void
}

const CATEGORIES: { key: EventCategory | 'all'; label: string; icon: string }[] = [
  { key: 'all', label: 'Todo', icon: '◈' },
  { key: 'conferencia', label: 'Conferencias', icon: '◎' },
  { key: 'taller', label: 'Talleres', icon: '◱' },
  { key: 'networking', label: 'Networking', icon: '◉' },
  { key: 'webinar', label: 'Webinars', icon: '▷' },
  { key: 'concierto', label: 'Conciertos', icon: '♪' },
  { key: 'exposicion', label: 'Exposiciones', icon: '◻' },
]

const CAT_COLORS: Record<string, string> = {
  conferencia: '#1B2A4A',
  taller: '#2D5A27',
  networking: '#7B3F00',
  webinar: '#1A4A6B',
  concierto: '#4A1B3F',
  exposicion: '#4A3B1B',
}

function EventCard({ event, onClick }: { event: Event; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  const d = new Date(event.date)
  const minPrice = Math.min(...event.ticketTypes.map(t => t.price))
  const fill = Math.round((event.registered / event.capacity) * 100)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        backgroundColor: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? '0 8px 24px rgba(27,42,74,0.10)' : 'none',
      }}
    >
      {event.imageUrl && (
        <div style={{ height: 180, overflow: 'hidden', backgroundColor: '#ddd', position: 'relative' }}>
          <img src={event.imageUrl} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {event.featured && (
            <span style={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'var(--color-accent)', color: '#fff', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.2rem 0.55rem', borderRadius: 2 }}>Destacado</span>
          )}
          <span style={{ position: 'absolute', top: 10, right: 10, backgroundColor: CAT_COLORS[event.category] ?? 'var(--color-primary)', color: '#fff', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.2rem 0.55rem', borderRadius: 2 }}>
            {event.category}
          </span>
        </div>
      )}
      <div style={{ padding: '1.1rem' }}>
        <p style={{ margin: '0 0 0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.08em', color: 'var(--color-muted-foreground)', textTransform: 'uppercase' }}>
          {d.toLocaleDateString('es', { day: 'numeric', month: 'short' })} · {event.city}
        </p>
        <h3 style={{ margin: '0 0 0.6rem', fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--color-primary)', lineHeight: 1.3 }}>
          {event.title}
        </h3>
        <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: 'var(--color-muted-foreground)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {event.description}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: minPrice === 0 ? '#1a6e2e' : 'var(--color-primary)' }}>
            {minPrice === 0 ? 'Gratis' : `Desde €${minPrice}`}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: fill > 90 ? 'var(--color-accent)' : 'var(--color-muted-foreground)' }}>
            {fill > 90 ? '¡Casi lleno!' : `${fill}% ocupado`}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function HomePage({ events, onViewEvent, onExplore, onSearch }: Props) {
  const [searchInput, setSearchInput] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const published = events.filter(e => e.status === 'publicado')
  const featured = published.filter(e => e.featured)
  const upcoming = [...published].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 4)
  const popular = [...published].sort((a, b) => (b.registered / b.capacity) - (a.registered / a.capacity)).slice(0, 4)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchInput.trim()) onSearch(searchInput.trim())
  }

  const catFiltered = activeCategory === 'all'
    ? published
    : published.filter(e => e.category === activeCategory)

  return (
    <div>
      {/* Hero */}
      <div style={{ backgroundColor: 'var(--color-primary)', padding: '5rem 2rem 4rem' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-accent)', margin: '0 0 1rem' }}>La plataforma de eventos</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', fontWeight: 600, letterSpacing: '-0.04em', color: '#F5F3EE', margin: '0 0 1.25rem', lineHeight: 1.1 }}>
            Descubre eventos<br /><em style={{ fontStyle: 'italic', color: 'rgba(245,243,238,0.65)' }}>que importan.</em>
          </h1>
          <p style={{ color: 'rgba(245,243,238,0.65)', fontSize: '1rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
            Conferencias, talleres, conciertos y más. Encuentra tu próxima experiencia.
          </p>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', maxWidth: 560, margin: '0 auto' }}>
            <input
              type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Busca eventos, artistas, lugares..."
              style={{ flex: 1, padding: '0.85rem 1.1rem', border: 'none', borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', fontSize: '0.9rem', outline: 'none' }}
            />
            <button type="submit" style={{ padding: '0.85rem 1.5rem', border: 'none', borderRadius: 'var(--radius)', backgroundColor: 'var(--color-accent)', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Buscar
            </button>
          </form>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '3rem 2rem' }}>
        {/* Featured */}
        {featured.length > 0 && (
          <section style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--color-primary)', margin: 0 }}>Eventos destacados</h2>
              <button onClick={onExplore} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}>Ver todos →</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
              {featured.map(ev => <EventCard key={ev.id} event={ev} onClick={() => onViewEvent(ev)} />)}
            </div>
          </section>
        )}

        {/* Categories */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--color-primary)', margin: '0 0 1.25rem' }}>Por categoría</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {CATEGORIES.map(cat => (
              <button key={cat.key} onClick={() => setActiveCategory(cat.key)} style={{
                padding: '0.45rem 1rem', border: `1px solid ${activeCategory === cat.key ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 100, backgroundColor: activeCategory === cat.key ? 'var(--color-primary)' : 'transparent',
                color: activeCategory === cat.key ? '#fff' : 'var(--color-foreground)',
                fontFamily: 'var(--font-body)', fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {catFiltered.slice(0, 6).map(ev => <EventCard key={ev.id} event={ev} onClick={() => onViewEvent(ev)} />)}
          </div>
        </section>

        {/* Upcoming */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--color-primary)', margin: '0 0 1.25rem' }}>Próximos eventos</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {upcoming.map(ev => {
              const d = new Date(ev.date)
              const minPrice = Math.min(...ev.ticketTypes.map(t => t.price))
              return (
                <div key={ev.id} onClick={() => onViewEvent(ev)} style={{ display: 'grid', gridTemplateColumns: '3.5rem 1fr auto', gap: '1.25rem', alignItems: 'center', backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '1rem 1.25rem', cursor: 'pointer', transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F0EEEA')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-card)')}>
                  <div style={{ textAlign: 'center', backgroundColor: 'var(--color-secondary)', borderRadius: 2, padding: '0.35rem 0' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--color-muted-foreground)', textTransform: 'uppercase' }}>{d.toLocaleDateString('es', { month: 'short' })}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1 }}>{d.getDate()}</div>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{ev.title}</p>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: 'var(--color-muted-foreground)' }}>{ev.venueName} · {ev.city}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--color-primary)', fontSize: '0.95rem' }}>{minPrice === 0 ? 'Gratis' : `€${minPrice}`}</p>
                    <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: 'var(--color-accent)', fontWeight: 500 }}>Ver →</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}


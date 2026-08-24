import { useState, useEffect } from 'react'
import type { Event, EventCategory, EventModality } from '../../types'

type Props = {
  events: Event[]
  initialSearch?: string
  onViewEvent: (ev: Event) => void
}

const CAT_LABELS: Record<string, string> = {
  conferencia: 'Conferencia', taller: 'Taller', networking: 'Networking',
  webinar: 'Webinar', concierto: 'Concierto', exposicion: 'Exposición',
}

export default function ExplorePage({ events, initialSearch = '', onViewEvent }: Props) {
  const [search, setSearch] = useState(initialSearch)
  const [category, setCategory] = useState<EventCategory | ''>('')
  const [modality, setModality] = useState<EventModality | ''>('')
  const [sortBy, setSortBy] = useState<'fecha' | 'precio_asc' | 'precio_desc' | 'popularidad'>('fecha')

  useEffect(() => { setSearch(initialSearch) }, [initialSearch])

  const published = events.filter(e => e.status === 'publicado')

  const filtered = published
    .filter(e => {
      const q = search.toLowerCase()
      return (!q || e.title.toLowerCase().includes(q) || e.city.toLowerCase().includes(q) || e.organizerName.toLowerCase().includes(q))
        && (!category || e.category === category)
        && (!modality || e.modality === modality)
    })
    .sort((a, b) => {
      if (sortBy === 'fecha') return new Date(a.date).getTime() - new Date(b.date).getTime()
      if (sortBy === 'popularidad') return (b.registered / b.capacity) - (a.registered / a.capacity)
      const minA = Math.min(...a.ticketTypes.map(t => t.price))
      const minB = Math.min(...b.ticketTypes.map(t => t.price))
      return sortBy === 'precio_asc' ? minA - minB : minB - minA
    })

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2.5rem 2rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--color-primary)', margin: '0 0 0.5rem' }}>Explorar eventos</h1>
      <p style={{ color: 'var(--color-muted-foreground)', marginBottom: '2rem', fontSize: '0.9rem' }}>{filtered.length} eventos disponibles</p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem', padding: '1.25rem 1.5rem', backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}>
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Nombre, ciudad, organizador..."
          style={{ flex: '2 1 200px', padding: '0.55rem 0.85rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', outline: 'none' }}
        />
        <select value={category} onChange={e => setCategory(e.target.value as EventCategory | '')} style={{ flex: '1 1 150px', padding: '0.55rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', cursor: 'pointer' }}>
          <option value="">Todas las categorías</option>
          {Object.entries(CAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={modality} onChange={e => setModality(e.target.value as EventModality | '')} style={{ flex: '1 1 120px', padding: '0.55rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', cursor: 'pointer' }}>
          <option value="">Modalidad</option>
          <option value="presencial">Presencial</option>
          <option value="online">Online</option>
          <option value="hibrido">Híbrido</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} style={{ flex: '1 1 140px', padding: '0.55rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', cursor: 'pointer' }}>
          <option value="fecha">Ordenar: Fecha</option>
          <option value="popularidad">Más populares</option>
          <option value="precio_asc">Precio: menor</option>
          <option value="precio_desc">Precio: mayor</option>
        </select>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-muted-foreground)' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontStyle: 'italic' }}>Sin resultados.</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Prueba con otros términos o filtros.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {filtered.map(ev => {
            const d = new Date(ev.date)
            const minPrice = Math.min(...ev.ticketTypes.map(t => t.price))
            const fill = Math.round((ev.registered / ev.capacity) * 100)
            return (
              <div key={ev.id} onClick={() => onViewEvent(ev)} style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(27,42,74,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
                {ev.imageUrl && (
                  <div style={{ height: 170, overflow: 'hidden', backgroundColor: '#ccc' }}>
                    <img src={ev.imageUrl} alt={ev.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase', backgroundColor: 'var(--color-secondary)', color: 'var(--color-primary)', padding: '0.15rem 0.45rem', borderRadius: 2 }}>{ev.category}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase', backgroundColor: ev.modality === 'online' ? '#e6f4ea' : 'var(--color-secondary)', color: ev.modality === 'online' ? '#1a6e2e' : 'var(--color-muted-foreground)', padding: '0.15rem 0.45rem', borderRadius: 2 }}>{ev.modality}</span>
                  </div>
                  <h3 style={{ margin: '0 0 0.4rem', fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--color-primary)', lineHeight: 1.3 }}>{ev.title}</h3>
                  <p style={{ margin: '0 0 0.85rem', fontSize: '0.78rem', color: 'var(--color-muted-foreground)' }}>
                    {d.toLocaleDateString('es', { day: 'numeric', month: 'long' })} · {ev.city}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: minPrice === 0 ? '#1a6e2e' : 'var(--color-primary)' }}>
                      {minPrice === 0 ? 'Gratis' : `Desde €${minPrice}`}
                    </span>
                    <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: fill > 90 ? 'var(--color-accent)' : 'var(--color-muted-foreground)' }}>
                      {fill > 90 ? '¡Casi lleno!' : `${fill}% ocupado`}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


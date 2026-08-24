import { useState } from 'react'
import type { Event, UserProfile, TicketType } from '../../types'

type Props = {
  event: Event
  onBack: () => void
  onBuy: (ev: Event) => void
  currentUser: UserProfile | null
}

const CAT_LABELS: Record<string, string> = {
  conferencia: 'Conferencia', taller: 'Taller', networking: 'Networking',
  webinar: 'Webinar', concierto: 'Concierto', exposicion: 'Exposición',
}

const MODALITY_LABELS: Record<string, string> = {
  presencial: 'Presencial', online: 'Online', hibrido: 'Híbrido',
}

export default function EventDetailPage({ event, onBack, onBuy, currentUser }: Props) {
  const [selectedType, setSelectedType] = useState<TicketType | null>(null)

  const d = new Date(event.date)
  const dEnd = new Date(event.endDate)
  const fill = Math.round((event.registered / event.capacity) * 100)
  const available = event.ticketTypes.filter(t => t.status !== 'VENDIDO' && t.sold < t.totalQuantity)

  return (
    <div>
      {/* Hero image */}
      {event.imageUrl && (
        <div style={{ height: 360, overflow: 'hidden', backgroundColor: '#1B2A4A', position: 'relative' }}>
          <img src={event.imageUrl} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(27,42,74,0.7) 0%, transparent 60%)' }} />
          <button onClick={onBack} style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(0,0,0,0.45)', border: 'none', color: '#fff', borderRadius: 2, padding: '0.45rem 0.9rem', fontFamily: 'var(--font-body)', fontSize: '0.8rem', cursor: 'pointer' }}>← Volver</button>
          <div style={{ position: 'absolute', bottom: 24, left: 32, right: 32 }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ backgroundColor: 'var(--color-accent)', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.2rem 0.55rem', borderRadius: 2 }}>{CAT_LABELS[event.category]}</span>
              <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.2rem 0.55rem', borderRadius: 2 }}>{MODALITY_LABELS[event.modality]}</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 4vw, 2.6rem)', fontWeight: 600, letterSpacing: '-0.03em', color: '#fff', margin: 0, lineHeight: 1.15 }}>{event.title}</h1>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2.5rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2.5rem', alignItems: 'start' }}>
          {/* Left: info */}
          <div>
            {/* Meta info */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              {[
                { label: 'Fecha y hora', value: d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ' · ' + d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) },
                { label: 'Duración', value: `Hasta las ${dEnd.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })} del ${dEnd.toLocaleDateString('es', { day: 'numeric', month: 'short' })}` },
                { label: 'Recinto', value: event.venueName },
                { label: 'Ubicación', value: event.modality === 'online' ? 'Online' : `${event.address}, ${event.city}` },
                { label: 'Organizador', value: event.organizerName },
                { label: 'Aforo', value: `${event.capacity.toLocaleString()} personas · ${fill}% ocupado` },
              ].map(item => (
                <div key={item.label} style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}>
                  <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)' }}>{item.label}</p>
                  <p style={{ margin: '0.3rem 0 0', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-foreground)', lineHeight: 1.35 }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--color-primary)', margin: '0 0 0.85rem' }}>Sobre el evento</h2>
              <p style={{ lineHeight: 1.75, fontSize: '0.95rem', color: 'var(--color-foreground)', margin: 0 }}>{event.description}</p>
            </div>

            {/* Cancellation policy */}
            <div style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--color-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}>
              <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', marginBottom: '0.3rem' }}>Política de cancelación</p>
              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>{event.cancellationPolicy}</p>
            </div>
          </div>

          {/* Right: ticket selector */}
          <div style={{ position: 'sticky', top: 80 }}>
            <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-primary)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: '#F5F3EE', margin: 0 }}>Entradas disponibles</h3>
              </div>
              <div style={{ padding: '1rem' }}>
                {event.ticketTypes.map(tt => {
                  const sold_out = tt.sold >= tt.totalQuantity
                  const isSelected = selectedType?.id === tt.id
                  return (
                    <div key={tt.id} onClick={() => !sold_out && setSelectedType(isSelected ? null : tt)}
                      style={{
                        padding: '1rem', border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius)', marginBottom: '0.75rem', cursor: sold_out ? 'not-allowed' : 'pointer',
                        opacity: sold_out ? 0.5 : 1, backgroundColor: isSelected ? 'var(--color-secondary)' : '#fff',
                        transition: 'all 0.15s',
                      }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-foreground)' }}>{tt.name}</p>
                          <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--color-muted-foreground)', lineHeight: 1.4 }}>{tt.description}</p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '0.75rem' }}>
                          <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: tt.price === 0 ? '#1a6e2e' : 'var(--color-primary)' }}>
                            {tt.price === 0 ? 'Gratis' : `€${tt.price}`}
                          </p>
                          <p style={{ margin: '0.1rem 0 0', fontSize: '0.7rem', color: sold_out ? '#a02020' : 'var(--color-muted-foreground)' }}>
                            {sold_out ? 'Agotado' : `${tt.totalQuantity - tt.sold} disponibles`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '0.25rem' }}>
                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', color: 'var(--color-muted-foreground)' }}>
                    Máx. {event.maxTicketsPerUser} entradas por usuario. {event.saleCutoffDate && `Venta hasta el ${new Date(event.saleCutoffDate).toLocaleDateString('es', { day: 'numeric', month: 'short' })}.`}
                  </p>
                  <button
                    onClick={() => onBuy(event)}
                    disabled={available.length === 0}
                    style={{
                      width: '100%', padding: '0.85rem', border: 'none', borderRadius: 'var(--radius)',
                      backgroundColor: available.length === 0 ? 'var(--color-muted)' : 'var(--color-accent)',
                      color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.95rem',
                      cursor: available.length === 0 ? 'not-allowed' : 'pointer',
                    }}>
                    {available.length === 0 ? 'Sin entradas disponibles' : 'Comprar entrada →'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


import type { Order, Event } from '../../types'
import QRCode from '../shared/QRCode'

type Props = {
  order: Order
  event: Event
  onDone: () => void
}

export default function ConfirmationPage({ order, event, onDone }: Props) {
  const d = new Date(event.date)

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '3rem 2rem', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#e6f4ea', border: '2px solid #1a6e2e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '1.8rem' }}>✓</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--color-primary)', margin: '0 0 0.5rem' }}>¡Compra confirmada!</h1>
      <p style={{ color: 'var(--color-muted-foreground)', marginBottom: '2.5rem', fontSize: '0.9rem' }}>
        Orden #{order.id} · {new Date(order.purchasedAt).toLocaleString('es')}
      </p>

      {/* Tickets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {order.tickets.map(ticket => (
          <div key={ticket.id} style={{
            backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
            overflow: 'hidden', textAlign: 'left',
            boxShadow: '0 4px 16px rgba(27,42,74,0.08)',
          }}>
            {/* Top strip */}
            <div style={{ backgroundColor: 'var(--color-primary)', padding: '0.85rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(245,243,238,0.55)' }}>EventHub Ticket</span>
                <p style={{ margin: '0.15rem 0 0', fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: '#F5F3EE', letterSpacing: '-0.01em' }}>{event.title}</p>
              </div>
              <span style={{ backgroundColor: 'var(--color-accent)', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.2rem 0.65rem', borderRadius: 2 }}>{ticket.ticketTypeName}</span>
            </div>

            {/* Body */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.5rem', padding: '1.25rem 1.5rem', alignItems: 'center' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                {[
                  { label: 'Titular', value: ticket.holderName },
                  { label: 'Ticket ID', value: ticket.id },
                  { label: 'Fecha', value: d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) },
                  { label: 'Hora', value: d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) },
                  { label: 'Recinto', value: ticket.venueName },
                  { label: 'Estado', value: 'Activo' },
                ].map(item => (
                  <div key={item.label}>
                    <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)' }}>{item.label}</p>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', fontWeight: 600, color: item.label === 'Estado' ? '#1a6e2e' : 'var(--color-foreground)' }}>{item.value}</p>
                  </div>
                ))}
              </div>
              {/* QR */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 4, display: 'inline-block', backgroundColor: '#fff' }}>
                  <QRCode value={ticket.qrCode} size={120} />
                </div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--color-muted-foreground)', marginTop: '0.5rem', letterSpacing: '0.04em' }}>{ticket.id}</p>
              </div>
            </div>

            {/* Bottom strip */}
            <div style={{ borderTop: '1px dashed var(--color-border)', padding: '0.65rem 1.5rem', backgroundColor: 'var(--color-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-muted-foreground)' }}>Presenta este QR en el acceso al evento</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-muted-foreground)' }}>eventhub.app</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
        <button onClick={onDone} style={{ padding: '0.75rem 2rem', border: 'none', borderRadius: 'var(--radius)', backgroundColor: 'var(--color-primary)', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
          Ver mis entradas
        </button>
      </div>
    </div>
  )
}


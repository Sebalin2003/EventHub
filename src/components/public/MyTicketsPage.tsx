import { useState } from 'react'
import type { Order, Event } from '../../types'
import QRCode from '../shared/QRCode'

type Props = {
  orders: Order[]
  events: Event[]
}

type Tab = 'proximos' | 'anteriores' | 'cancelados'

export default function MyTicketsPage({ orders, events }: Props) {
  const [tab, setTab] = useState<Tab>('proximos')
  const [expanded, setExpanded] = useState<string | null>(null)

  function getEvent(id: string) { return events.find(e => e.id === id) }

  const now = new Date()
  const tabs: { key: Tab; label: string }[] = [
    { key: 'proximos', label: 'Próximos eventos' },
    { key: 'anteriores', label: 'Eventos anteriores' },
    { key: 'cancelados', label: 'Entradas canceladas' },
  ]

  const filtered = orders.filter(o => {
    const ev = getEvent(o.eventId)
    if (!ev) return false
    const past = new Date(ev.date) < now
    if (tab === 'proximos') return !past && o.status === 'confirmado'
    if (tab === 'anteriores') return past && o.status === 'confirmado'
    return o.status === 'cancelado' || o.status === 'reembolsado'
  })

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '2.5rem 2rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--color-primary)', margin: '0 0 2rem' }}>Mis entradas</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--color-border)', marginBottom: '2rem', gap: '0' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '0.65rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: tab === t.key ? 600 : 400,
            color: tab === t.key ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
            borderBottom: `2px solid ${tab === t.key ? 'var(--color-primary)' : 'transparent'}`,
            marginBottom: '-2px', transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-muted-foreground)' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontStyle: 'italic', margin: 0 }}>Sin entradas.</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Aún no tienes entradas en esta categoría.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(order => {
            const ev = getEvent(order.eventId)!
            const d = new Date(ev.date)
            const isOpen = expanded === order.id
            return (
              <div key={order.id} style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                {/* Summary row */}
                <div onClick={() => setExpanded(isOpen ? null : order.id)} style={{ display: 'grid', gridTemplateColumns: '3.5rem 1fr auto', gap: '1rem', alignItems: 'center', padding: '1.1rem 1.25rem', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5F3EE')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}>
                  <div style={{ textAlign: 'center', backgroundColor: 'var(--color-secondary)', borderRadius: 2, padding: '0.35rem 0' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--color-muted-foreground)', textTransform: 'uppercase' }}>{d.toLocaleDateString('es', { month: 'short' })}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1 }}>{d.getDate()}</div>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{ev.title}</p>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: 'var(--color-muted-foreground)' }}>
                      {order.ticketTypeName} × {order.quantity} · {ev.venueName}, {ev.city}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--color-primary)', fontSize: '0.95rem' }}>€{order.total.toFixed(2)}</p>
                    <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: 'var(--color-accent)' }}>{isOpen ? 'Cerrar ↑' : 'Ver tickets ↓'}</p>
                  </div>
                </div>

                {/* Expanded tickets */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--color-border)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {order.tickets.map(ticket => (
                      <div key={ticket.id} style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: '1.5rem', alignItems: 'center', backgroundColor: 'var(--color-secondary)', borderRadius: 'var(--radius)', padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                          {[
                            { label: 'Ticket', value: ticket.id },
                            { label: 'Tipo', value: ticket.ticketTypeName },
                            { label: 'Titular', value: ticket.holderName },
                            { label: 'Estado', value: ticket.status === 'activo' ? 'Activo' : ticket.status === 'usado' ? 'Utilizado' : 'Cancelado' },
                          ].map(item => (
                            <div key={item.label}>
                              <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)' }}>{item.label}</p>
                              <p style={{ margin: '0.15rem 0 0', fontSize: '0.83rem', fontWeight: 600, color: item.label === 'Estado' && ticket.status === 'activo' ? '#1a6e2e' : 'var(--color-foreground)' }}>{item.value}</p>
                            </div>
                          ))}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ padding: '0.5rem', backgroundColor: '#fff', border: '1px solid var(--color-border)', borderRadius: 2, display: 'inline-block' }}>
                            <QRCode value={ticket.qrCode} size={100} />
                          </div>
                          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--color-muted-foreground)', margin: '0.35rem 0 0', letterSpacing: '0.04em' }}>{ticket.id}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


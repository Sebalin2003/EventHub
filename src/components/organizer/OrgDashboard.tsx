import type { Event, Order } from '../../types'
import { formatMoney } from '../../demoStore'

type Props = {
  events: Event[]
  orders: Order[]
  onNew: () => void
}

function Stat({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div style={{ backgroundColor: accent ? 'var(--color-primary)' : 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '1.4rem 1.5rem' }}>
      <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: accent ? 'rgba(245,243,238,0.5)' : 'var(--color-muted-foreground)' }}>{label}</p>
      <p style={{ margin: '0.5rem 0 0.25rem', fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 600, letterSpacing: '-0.03em', color: accent ? '#F5F3EE' : 'var(--color-primary)', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ margin: 0, fontSize: '0.78rem', color: accent ? 'rgba(245,243,238,0.55)' : 'var(--color-muted-foreground)' }}>{sub}</p>}
    </div>
  )
}

export default function OrgDashboard({ events, orders, onNew }: Props) {
  const published = events.filter(e => e.status === 'publicado')
  const totalSold = orders.reduce((s, o) => s + o.quantity, 0)
  const totalRevenue = orders.filter(o => o.status === 'confirmado').reduce((s, o) => s + o.total, 0)
  const totalCheckIns = events.reduce((s, e) => s + e.checkIns, 0)
  const totalCapacity = events.reduce((s, e) => s + e.capacity, 0)

  const recentSales = [...orders].sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()).slice(0, 6)

  // Sales by ticket type
  const byType: Record<string, { qty: number; rev: number }> = {}
  orders.forEach(o => {
    if (!byType[o.ticketTypeName]) byType[o.ticketTypeName] = { qty: 0, rev: 0 }
    byType[o.ticketTypeName].qty += o.quantity
    byType[o.ticketTypeName].rev += o.total
  })
  const maxQty = Math.max(...Object.values(byType).map(v => v.qty), 1)

  // Simple monthly bar chart (last 3 months)
  const months = ['Jun', 'Jul', 'Ago']
  const monthlySales = months.map((m, i) => {
    const monthIdx = 5 + i
    const rev = orders.filter(o => new Date(o.purchasedAt).getMonth() === monthIdx).reduce((s, o) => s + o.total, 0)
    return { label: m, value: rev }
  })
  const maxRev = Math.max(...monthlySales.map(m => m.value), 1)

  function getEventTitle(id: string) {
    return events.find(e => e.id === id)?.title ?? '—'
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--color-primary)', margin: 0 }}>Dashboard</h1>
          <p style={{ color: 'var(--color-muted-foreground)', marginTop: '0.35rem', fontSize: '0.875rem' }}>{published.length} eventos publicados · agosto 2026</p>
        </div>
        <button onClick={onNew} style={{ backgroundColor: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '0.6rem 1.25rem', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>+ Nuevo evento</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <Stat label="Entradas vendidas" value={totalSold.toLocaleString()} sub="todos los eventos" />
        <Stat label="Ingresos totales" value={formatMoney(Math.round(totalRevenue * 100))} sub="ventas confirmadas" accent />
        <Stat label="Capacidad total" value={`${Math.round((events.reduce((s,e)=>s+e.registered,0)/Math.max(totalCapacity,1))*100)}%`} sub={`${totalCapacity.toLocaleString()} aforo`} />
        <Stat label="Check-ins" value={totalCheckIns.toLocaleString()} sub="accesos registrados" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '5fr 4fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Ventas por mes */}
        <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-primary)', margin: '0 0 1.25rem' }}>Ingresos mensuales</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', height: 140 }}>
            {monthlySales.map(m => (
              <div key={m.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-muted-foreground)' }}>{formatMoney(Math.round(m.value * 100))}</span>
                <div style={{ width: '100%', height: `${Math.max(8, (m.value / maxRev) * 110)}px`, backgroundColor: m.value === Math.max(...monthlySales.map(x => x.value)) ? 'var(--color-accent)' : 'var(--color-primary)', borderRadius: '2px 2px 0 0', transition: 'height 0.4s ease' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Distribución por tipo */}
        <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-primary)', margin: '0 0 1.25rem' }}>Por tipo de entrada</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {Object.entries(byType).length === 0 ? (
              <p style={{ color: 'var(--color-muted-foreground)', fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>Sin ventas registradas.</p>
            ) : Object.entries(byType).map(([name, data]) => (
              <div key={name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--color-muted-foreground)' }}>{data.qty} · {formatMoney(Math.round(data.rev * 100))}</span>
                </div>
                <div style={{ height: 5, backgroundColor: 'var(--color-muted)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(data.qty / maxQty) * 100}%`, backgroundColor: 'var(--color-primary)', borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Últimas ventas */}
      <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-primary)', margin: 0 }}>Últimas ventas</h2>
        </div>
        {recentSales.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-muted-foreground)', fontStyle: 'italic' }}>Sin ventas registradas.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-secondary)' }}>
                {['Orden', 'Evento', 'Tipo', 'Cant.', 'Total', 'Fecha'].map(h => (
                  <th key={h} style={{ padding: '0.65rem 1.25rem', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentSales.map(o => (
                <tr key={o.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.75rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{o.id}</td>
                  <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.83rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getEventTitle(o.eventId)}</td>
                  <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.83rem' }}>{o.ticketTypeName}</td>
                  <td style={{ padding: '0.75rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.83rem' }}>{o.quantity}</td>
                  <td style={{ padding: '0.75rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.83rem', fontWeight: 600, color: 'var(--color-primary)' }}>{formatMoney(Math.round(o.total * 100))}</td>
                  <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.78rem', color: 'var(--color-muted-foreground)' }}>{new Date(o.purchasedAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

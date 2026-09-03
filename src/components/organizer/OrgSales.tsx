import type { Event, Order } from '../../types'
import { formatMoney } from '../../demoStore'

type Props = { events: Event[]; orders: Order[] }

export default function OrgSales({ events, orders }: Props) {
  const confirmed = orders.filter(o => o.status === 'confirmado')
  const totalRev = confirmed.reduce((s, o) => s + o.total, 0)
  const totalQty = confirmed.reduce((s, o) => s + o.quantity, 0)
  const totalFees = confirmed.reduce((s, o) => s + o.serviceFee, 0)

  function getEventTitle(id: string) { return events.find(e => e.id === id)?.title ?? '—' }

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--color-primary)', margin: '0 0 2rem' }}>Ventas</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Ingresos netos', value: formatMoney(Math.round(totalRev * 100)) },
          { label: 'Entradas vendidas', value: totalQty.toLocaleString() },
          { label: 'Cargos de servicio', value: formatMoney(Math.round(totalFees * 100)) },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '1.4rem 1.5rem' }}>
            <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)' }}>{s.label}</p>
            <p style={{ margin: '0.5rem 0 0', fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--color-primary)' }}>{s.value}</p>
          </div>
        ))}
      </div>
      <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-secondary)' }}>
              {['Orden', 'Evento', 'Tipo de entrada', 'Cantidad', 'Precio unit.', 'Cargo serv.', 'Total', 'Estado', 'Fecha'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>Sin ventas registradas.</td></tr>
            ) : orders.map(o => {
              const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
                confirmado: { bg: '#e6f4ea', color: '#1a6e2e' },
                pendiente: { bg: '#fff3cd', color: '#7d5c00' },
                cancelado: { bg: '#fde8e8', color: '#a02020' },
                reembolsado: { bg: '#e8edf5', color: '#1B2A4A' },
              }
              const sc = STATUS_COLOR[o.status] ?? { bg: '#eee', color: '#333' }
              return (
                <tr key={o.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{o.id}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getEventTitle(o.eventId)}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem' }}>{o.ticketTypeName}</td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{o.quantity}</td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{formatMoney(Math.round(o.unitPrice * 100))}</td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{formatMoney(Math.round(o.serviceFee * 100))}</td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)' }}>{formatMoney(Math.round(o.total * 100))}</td>
                  <td style={{ padding: '0.75rem 1rem' }}><span style={{ backgroundColor: sc.bg, color: sc.color, fontSize: '0.68rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', padding: '0.15rem 0.5rem', borderRadius: 2 }}>{o.status}</span></td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--color-muted-foreground)', whiteSpace: 'nowrap' }}>{new Date(o.purchasedAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

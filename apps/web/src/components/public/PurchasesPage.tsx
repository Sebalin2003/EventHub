import { useState } from 'react'
import type { DemoAction } from '../../demoStore'
import { formatMoney } from '../../demoStore'
import type { Event, Order, Refund, UserProfile } from '../../types'
import { Breadcrumb, EmptyState, StatusBadge, useToast } from '../shared/Ui'

type Props = {
  orders: Order[]
  events: Event[]
  currentUser: UserProfile
  dispatch: React.Dispatch<DemoAction>
  onHome: () => void
  onTickets: () => void
}

function isEligible(order: Order, event?: Event) {
  const policy = order.refundPolicySnapshot
  if (!event || order.status !== 'confirmado' || !policy?.refundable) return false
  return new Date(event.date).getTime() - Date.now() >= policy.cutoffHours * 60 * 60 * 1000
}

export default function PurchasesPage({ orders, events, currentUser, dispatch, onHome, onTickets }: Props) {
  const { notify } = useToast()
  const [expanded, setExpanded] = useState<string | null>(orders[0]?.id ?? null)
  const [refundOrder, setRefundOrder] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [outcome, setOutcome] = useState<'approved' | 'failed'>('approved')
  const sorted = [...orders].sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime())

  function requestRefund(order: Order) {
    const paidCents = order.totalCents ?? Math.round(order.total * 100)
    const percentage = order.refundPolicySnapshot?.percentage ?? 0
    const refundCents = Math.round(paidCents * percentage / 100)
    const refund: Refund = {
      id: `refund-${crypto.randomUUID()}`,
      orderId: order.id,
      requestedAt: new Date().toISOString(),
      paidCents,
      deductionCents: paidCents - refundCents,
      refundCents,
      destination: 'Medio de pago original',
      status: outcome,
      idempotencyKey: `refund-${order.id}-${crypto.randomUUID()}`,
    }
    dispatch({ type: 'REFUND_ORDER', refund, actorLabel: currentUser.name })
    setRefundOrder(null)
    setConfirmed(false)
    if (outcome === 'approved') notify(`Reembolso aprobado por ${formatMoney(refundCents)}.`, 'success')
    else notify('El proveedor rechazó el reembolso. La orden continúa confirmada y puedes reintentar.', 'error')
  }

  return <main className="page-shell page-section narrow-page">
    <Breadcrumb items={[{ label: 'Inicio', onClick: onHome }, { label: 'Mis compras' }]} />
    <div className="page-heading"><h1>Mis compras</h1><p>Consulta cada orden, sus entradas y el historial de cancelación.</p></div>
    {sorted.length === 0 ? <EmptyState title="Todavía no hay compras" message="Cuando confirmes una orden podrás consultar aquí todos sus importes y entradas." action="Volver al inicio" onAction={onHome} /> :
      <div className="purchase-list">{sorted.map(order => {
        const event = events.find(item => item.id === order.eventId)
        const open = expanded === order.id
        const policy = order.refundPolicySnapshot
        const eligible = isEligible(order, event)
        const paidCents = order.totalCents ?? Math.round(order.total * 100)
        const refundCents = Math.round(paidCents * (policy?.percentage ?? 0) / 100)
        return <article className="purchase" key={order.id}>
          <button className="purchase__summary" aria-expanded={open} onClick={() => setExpanded(open ? null : order.id)}><span><small>Orden #{order.id}</small><strong>{event?.title ?? 'Evento'}</strong><span>{new Date(order.purchasedAt).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })}</span></span><StatusBadge tone={order.status === 'confirmado' ? 'success' : order.status === 'reembolsado' ? 'info' : 'danger'}>{order.status}</StatusBadge><b>{formatMoney(paidCents)}</b><span aria-hidden="true">{open ? '−' : '+'}</span></button>
          {open && <div className="purchase__detail">
            <dl className="money-breakdown"><div><dt>{order.ticketTypeName} × {order.quantity}</dt><dd>{formatMoney(order.subtotalCents ?? Math.round(order.unitPrice * order.quantity * 100))}</dd></div>{order.items?.[0]?.seatLabels.length ? <div><dt>Localidades</dt><dd>{order.items[0].seatLabels.join('; ')}</dd></div> : null}<div><dt>Cargos</dt><dd>{formatMoney(order.serviceFeeCents ?? Math.round(order.serviceFee * 100))}</dd></div><div className="total"><dt>Total</dt><dd>{formatMoney(paidCents)}</dd></div></dl>
            <div className="purchase__actions"><button className="button button--ghost" onClick={onTickets}>Ver {order.tickets.length} {order.tickets.length === 1 ? 'entrada' : 'entradas'}</button>{eligible && refundOrder !== order.id && <button className="button button--danger" onClick={() => { setRefundOrder(order.id); setConfirmed(false) }}>Solicitar cancelación</button>}{!eligible && order.status === 'confirmado' && <p className="policy-note">Esta orden no cumple actualmente la política de reembolso: {policy?.label}</p>}</div>
            {refundOrder === order.id && <section className="refund-panel"><h2>Confirmar cancelación y reembolso</h2><p>Esta acción cancela todas las entradas de la orden y no puede deshacerse.</p><dl><div><dt>Importe pagado</dt><dd>{formatMoney(paidCents)}</dd></div><div><dt>Deducciones</dt><dd>{formatMoney(paidCents - refundCents)}</dd></div><div className="total"><dt>A devolver</dt><dd>{formatMoney(refundCents)}</dd></div><div><dt>Destino</dt><dd>Medio de pago original</dd></div></dl><label className="demo-control">Resultado de demostración<select value={outcome} onChange={event => setOutcome(event.target.value as typeof outcome)}><option value="approved">Reembolso aprobado</option><option value="failed">Error del proveedor</option></select></label><label className="irreversible-check"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />Confirmo que quiero cancelar estas entradas.</label><div><button className="button button--danger" disabled={!confirmed} onClick={() => requestRefund(order)}>Confirmar cancelación</button><button className="button button--ghost" onClick={() => setRefundOrder(null)}>Volver</button></div></section>}
          </div>}
        </article>
      })}</div>}
  </main>
}

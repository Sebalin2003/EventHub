import type { Event, Order } from '../../types'
import { formatMoney } from '../../demoStore'
import QRCode from '../shared/QRCode'

export default function ConfirmationPage({ order, event, onTickets, onPurchases }: { order: Order; event: Event; onTickets: () => void; onPurchases: () => void }) {
  return <main className="page-shell confirmation-page">
    <div className="confetti" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index} />)}</div>
    <div className="success-mark" aria-hidden="true">✓</div>
    <h1>Compra confirmada</h1>
    <p className="confirmation-lead">Tu orden <b>#{order.id}</b> fue aprobada por {formatMoney(order.totalCents ?? Math.round(order.total * 100))}.</p>
    <div className="ticket-preview-list">
      {order.tickets.map(ticket => <article key={ticket.id} className="ticket-preview"><div><span>{ticket.ticketTypeName}</span><h2>{event.title}</h2><p>{new Date(event.date).toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' })}</p>{ticket.seatLabel && <strong>{ticket.seatLabel}</strong>}<small>{ticket.id}</small></div><QRCode value={ticket.qrCode} size={112} /></article>)}
    </div>
    <div className="confirmation-actions"><button className="button button--primary" onClick={onTickets}>Ver mis entradas</button><button className="button button--ghost" onClick={onPurchases}>Ver compra</button></div>
  </main>
}

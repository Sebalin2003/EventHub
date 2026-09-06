import { useState } from 'react'
import type { Event, Order, Ticket } from '../../types'
import QRCode from '../shared/QRCode'
import { Breadcrumb, EmptyState, StatusBadge, useToast } from '../shared/Ui'
import { downloadTicketPng } from '../../ticketDownload'

type Tab = 'upcoming' | 'used' | 'cancelled'

export default function MyTicketsPage({ orders, events, onHome }: { orders: Order[]; events: Event[]; onHome: () => void }) {
  const [tab, setTab] = useState<Tab>('upcoming')
  const [expanded, setExpanded] = useState<string | null>(null)
  const { notify } = useToast()
  const tickets = orders.flatMap(order => order.tickets)
  const filtered = tickets.filter(ticket => {
    if (tab === 'cancelled') return ticket.status === 'cancelado'
    if (tab === 'used') return ticket.status === 'usado' || new Date(ticket.eventDate) < new Date()
    return ticket.status === 'activo' && new Date(ticket.eventDate) >= new Date()
  })

  function download(ticket: Ticket) {
    try { downloadTicketPng(ticket); notify(`Entrada ${ticket.id} descargada como imagen.`, 'success') }
    catch { notify('No se pudo generar la imagen de la entrada.', 'error') }
  }

  return <main className="page-shell page-section narrow-page">
    <Breadcrumb items={[{ label: 'Inicio', onClick: onHome }, { label: 'Mis entradas' }]} />
    <div className="page-heading"><h1>Mis entradas</h1><p>Consulta, presenta o descarga tus tickets.</p></div>
    <div className="tab-list" role="tablist" aria-label="Filtrar entradas">{[['upcoming', 'Próximas'], ['used', 'Utilizadas'], ['cancelled', 'Canceladas']].map(([key, label]) => <button key={key} role="tab" aria-selected={tab === key} className={tab === key ? 'is-active' : ''} onClick={() => setTab(key as Tab)}>{label}</button>)}</div>
    {filtered.length === 0 ? <EmptyState title="No hay entradas en esta sección" message="Tus entradas aparecerán aquí cuando correspondan a este estado." action="Ver próximas" onAction={() => setTab('upcoming')} /> :
      <div className="ticket-list">{filtered.map(ticket => {
        const event = events.find(item => item.id === ticket.eventId)
        const open = expanded === ticket.id
        return <article className="ticket-row" key={ticket.id}><button className="ticket-row__summary" aria-expanded={open} onClick={() => setExpanded(open ? null : ticket.id)}><span className="ticket-row__date"><b>{new Date(ticket.eventDate).getDate()}</b>{new Date(ticket.eventDate).toLocaleDateString('es-AR', { month: 'short' })}</span><span><strong>{ticket.eventTitle}</strong><small>{ticket.ticketTypeName}{ticket.seatLabel ? ` · ${ticket.seatLabel}` : ''}</small></span><StatusBadge tone={ticket.status === 'activo' ? 'success' : ticket.status === 'cancelado' ? 'danger' : 'warning'}>{ticket.status}</StatusBadge><span aria-hidden="true">{open ? '−' : '+'}</span></button>{open && <div className="ticket-row__detail"><div><p><b>Recinto</b>{event?.venueName ?? ticket.venueName}</p><p><b>Titular</b>{ticket.holderName}</p><p><b>Código</b>{ticket.id}</p><button className="button button--secondary" onClick={() => download(ticket)} disabled={ticket.status === 'cancelado'}>Descargar PNG</button></div><div className="ticket-qr"><QRCode value={ticket.qrCode} size={132} /><small>{ticket.id}</small></div></div>}</article>
      })}</div>}
  </main>
}

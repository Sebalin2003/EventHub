import type { DemoState, Event, UserProfile } from '../../types'
import { activeHolds, effectiveAvailability, formatMoney } from '../../demoStore'
import { Breadcrumb, StatusBadge } from '../shared/Ui'
import { useI18n } from '../../i18n'

type Props = {
  state: DemoState
  event: Event
  currentUser: UserProfile | null
  favorite: boolean
  onToggleFavorite: () => void
  onBack: () => void
  onHome: () => void
  onBuy: (event: Event) => void
}

export default function EventDetailPage({ state, event, favorite, onToggleFavorite, onBack, onHome, onBuy }: Props) {
  const { t, locale } = useI18n()
  const start = new Date(event.date)
  const end = new Date(event.endDate)
  const holds = activeHolds(state, event.id)
  const heldItems = holds.flatMap(hold => hold.items).length
  const available = event.ticketTypes.some(type => effectiveAvailability(state, event.id, type.id) > 0)

  return <main>
    <div className="event-detail-hero">
      {event.imageUrl && <img src={event.imageUrl} alt="" />}
      <div className="event-detail-hero__overlay" />
      <div className="event-detail-hero__content">
        <div><span>{event.category}</span><span>{event.modality}</span></div>
        <h1>{event.title}</h1>
      </div>
    </div>
    <div className="page-shell detail-shell">
      <Breadcrumb items={[{ label: t('home'), onClick: onHome }, { label: t('explore'), onClick: onBack }, { label: event.title }]} />
      <div className="detail-layout">
        <div className="detail-main">
          <section className="event-facts" aria-label={t('eventInfo')}>
            {[
              [t('dateTime'), start.toLocaleString(locale, { dateStyle: 'long', timeStyle: 'short' })],
              [t('duration'), `${t('until')} ${end.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}`],
              [t('venue'), event.venueName], [t('location'), event.modality === 'online' ? t('online') : `${event.address}, ${event.city}`],
              [t('organizer'), event.organizerName], [t('capacity'), `${event.capacity.toLocaleString(locale)} ${t('people')}`],
            ].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
          </section>
          <section className="prose-section"><h2>{t('about')}</h2><p>{event.description}</p></section>
          {event.seatingMode === 'numbered' && <section className="seating-summary"><div><h2>{t('numberedSeats')}</h2><p>{t('numberedSeatsBody')}</p></div><StatusBadge tone="info">{event.seats?.filter(seat => seat.status === 'available').length ?? 0} {t('seatsOnMap')}</StatusBadge></section>}
          <section className="policy-box"><h2>{t('cancellationPolicy')}</h2><p>{event.cancellationPolicy}</p></section>
        </div>
        <aside className="ticket-panel">
          <div className="ticket-panel__heading"><div><h2>{t('entryTickets')}</h2><p>{t('finalPrices')}</p></div><button className={`favorite-button favorite-button--inline${favorite ? ' is-favorite' : ''}`} type="button" aria-pressed={favorite} aria-label={favorite ? t('removeFavorite') : t('saveFavorite')} onClick={onToggleFavorite}>{favorite ? '♥' : '♡'}</button></div>
          {heldItems > 0 && <div className="hold-notice" role="status"><b>{t('activeHold')}</b><span>{heldItems} {heldItems === 1 ? t('heldOne') : t('heldMany')}</span></div>}
          <div className="ticket-panel__types">
            {event.ticketTypes.map(type => {
              const count = effectiveAvailability(state, event.id, type.id)
              return <div key={type.id} className="ticket-type-row"><div><strong>{type.name}</strong><span>{type.description}</span></div><div><b>{type.price === 0 ? t('free') : formatMoney(type.priceCents ?? type.price * 100, locale)}</b><span>{count > 0 ? `${count} ${t('available')}` : t('soldOut')}</span></div></div>
            })}
          </div>
          <p className="ticket-panel__limit">{t('maxTickets', { count: event.maxTicketsPerUser })}</p>
          <button className="button button--primary button--block" disabled={!available} onClick={() => onBuy(event)}>{available ? t('chooseTickets') : t('eventSoldOut')}</button>
        </aside>
      </div>
    </div>
  </main>
}

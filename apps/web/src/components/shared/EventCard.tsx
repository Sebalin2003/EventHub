import type { Event } from '../../types'
import { formatMoney } from '../../demoStore'
import { useI18n } from '../../i18n'

type Props = {
  event: Event
  onView: () => void
}

export default function EventCard({ event, onView }: Props) {
  const { t, locale } = useI18n()
  const minimum = Math.min(...event.ticketTypes.map(type => type.priceCents ?? Math.round(type.price * 100)))
  const occupancy = Math.round((event.registered / event.capacity) * 100)
  return (
    <article className="event-card">
      <div className="event-card__media">
        {event.imageUrl && <img src={event.imageUrl} alt="" loading="lazy" />}
        <span className="event-card__category">{event.category}</span>
      </div>
      <button className="event-card__body" type="button" onClick={onView} aria-label={`${t('viewEvent')} ${event.title}`}>
        <span className="event-card__date">{new Date(event.date).toLocaleDateString(locale, { day: 'numeric', month: 'short' })} · {event.city}</span>
        <strong>{event.title}</strong>
        <span className="event-card__description">{event.description}</span>
        <span className="event-card__footer">
          <b>{minimum === 0 ? t('free') : `${t('from')} ${formatMoney(minimum, locale)}`}</b>
          <span>{occupancy >= 90 ? t('nearlySoldOut') : `${occupancy}% ${t('occupied')}`}</span>
        </span>
      </button>
    </article>
  )
}

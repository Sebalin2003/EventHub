import { useMemo, useState } from 'react'
import type { Event, EventCategory, EventModality } from '../../types'
import EventCard from '../shared/EventCard'
import { EmptyState } from '../shared/Ui'
import { useI18n } from '../../i18n'

type Props = {
  events: Event[]
  initialSearch: string
  onViewEvent: (event: Event) => void
}

export default function ExplorePage({ events, initialSearch, onViewEvent }: Props) {
  const { t } = useI18n()
  const [search, setSearch] = useState(initialSearch)
  const [category, setCategory] = useState<EventCategory | ''>('')
  const [modality, setModality] = useState<EventModality | ''>('')
  const [sort, setSort] = useState<'date' | 'popular' | 'price'>('date')
  const results = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es')
    return events.filter(event => event.status === 'publicado')
      .filter(event => !query || [event.title, event.city, event.organizerName].some(value => value.toLocaleLowerCase('es').includes(query)))
      .filter(event => !category || event.category === category)
      .filter(event => !modality || event.modality === modality)
      .sort((a, b) => sort === 'popular' ? b.registered - a.registered : sort === 'price'
        ? Math.min(...a.ticketTypes.map(type => type.price)) - Math.min(...b.ticketTypes.map(type => type.price))
        : new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [events, search, category, modality, sort])
  const clear = () => { setSearch(''); setCategory(''); setModality(''); setSort('date') }

  return <main className="page-shell page-section">
    <div className="page-heading"><h1>{t('exploreTitle')}</h1><p>{t('exploreBody')}</p></div>
    <section className="filter-bar" aria-label={t('exploreTitle')}>
      <label><span>{t('search')}</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder={t('searchPlaceholder')} /></label>
      <label><span>{t('category')}</span><select value={category} onChange={event => setCategory(event.target.value as EventCategory | '')}><option value="">{t('allF')}</option><option value="conferencia">{t('conference')}</option><option value="taller">{t('workshop')}</option><option value="networking">{t('networking')}</option><option value="webinar">{t('webinar')}</option><option value="concierto">{t('concert')}</option><option value="exposicion">{t('exhibition')}</option></select></label>
      <label><span>{t('modality')}</span><select value={modality} onChange={event => setModality(event.target.value as EventModality | '')}><option value="">{t('allF')}</option><option value="presencial">{t('inPerson')}</option><option value="online">{t('online')}</option><option value="hibrido">{t('hybrid')}</option></select></label>
      <label><span>{t('sort')}</span><select value={sort} onChange={event => setSort(event.target.value as typeof sort)}><option value="date">{t('date')}</option><option value="popular">{t('popularity')}</option><option value="price">{t('price')}</option></select></label>
    </section>
    <p className="result-count" aria-live="polite">{results.length} {results.length === 1 ? t('event') : t('events')}</p>
    {results.length === 0 ? <EmptyState title={t('noEvents')} message={t('noEventsBody')} action={t('clearFilters')} onAction={clear} /> :
      <div className="event-grid">{results.map(event => <EventCard key={event.id} event={event} onView={() => onViewEvent(event)} />)}</div>}
  </main>
}

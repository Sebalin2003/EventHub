import { useState } from 'react'
import type { Event } from '../../types'
import EventCard from '../shared/EventCard'
import { useI18n } from '../../i18n'

type Props = {
  events: Event[]
  onViewEvent: (event: Event) => void
  onExplore: () => void
  onSearch: (query: string) => void
}

export default function HomePage({ events, onViewEvent, onExplore, onSearch }: Props) {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const published = events.filter(event => event.status === 'publicado')
  const featured = published.filter(event => event.featured).slice(0, 3)
  const filtered = category === 'all' ? published : published.filter(event => event.category === category)
  const categories = [['all', t('all')], ['conferencia', t('conferences')], ['taller', t('workshops')], ['networking', t('networking')], ['webinar', t('webinars')], ['concierto', t('concerts')], ['exposicion', t('exhibitions')]]

  return <>
    <section className="home-hero">
      <div className="home-hero__inner">
        <p className="home-hero__label">{t('heroLabel')}</p>
        <h1>{t('heroTitle')} <em>{t('heroEmphasis')}</em></h1>
        <p>{t('heroBody')}</p>
        <form className="hero-search" onSubmit={event => { event.preventDefault(); if (query.trim()) onSearch(query.trim()) }}>
          <label className="sr-only" htmlFor="home-search">{t('searchEvents')}</label>
          <input id="home-search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t('searchPlaceholder')} />
          <button className="button button--primary" type="submit">{t('search')}</button>
        </form>
      </div>
    </section>
    <main className="page-shell home-content">
      <div className="section-heading"><h2>{t('featured')}</h2><button type="button" onClick={onExplore}>{t('viewAll')}</button></div>
      <div className="event-grid">
        {featured.map(event => <EventCard key={event.id} event={event} onView={() => onViewEvent(event)} />)}
      </div>
      <section className="category-section">
        <h2>{t('byCategory')}</h2>
        <div className="category-tabs" role="group" aria-label={t('filterCategory')}>
          {categories.map(([key, label]) => <button type="button" key={key} className={category === key ? 'is-active' : ''} aria-pressed={category === key} onClick={() => setCategory(key)}>{label}</button>)}
        </div>
        <div className="event-grid">
          {filtered.slice(0, 6).map(event => <EventCard key={event.id} event={event} onView={() => onViewEvent(event)} />)}
        </div>
      </section>
    </main>
  </>
}

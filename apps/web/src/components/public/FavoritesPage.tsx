import type { Event } from '../../types'
import { Breadcrumb, EmptyState } from '../shared/Ui'
import EventCard from '../shared/EventCard'
import { useI18n } from '../../i18n'

export default function FavoritesPage({ events, favoriteIds, onView, onExplore, onHome }: { events: Event[]; favoriteIds: string[]; onView: (event: Event) => void; onExplore: () => void; onHome: () => void }) {
  const { t } = useI18n()
  const favorites = events.filter(event => favoriteIds.includes(event.id) && event.status === 'publicado')
  return <main className="page-shell page-section"><Breadcrumb items={[{ label: t('home'), onClick: onHome }, { label: t('favorites') }]} /><div className="page-heading"><h1>{t('favorites')}</h1><p>{t('favoritesBody')}</p></div>{favorites.length === 0 ? <EmptyState title={t('noFavorites')} message={t('noFavoritesBody')} action={t('exploreTitle')} onAction={onExplore} /> : <div className="event-grid">{favorites.map(event => <EventCard key={event.id} event={event} onView={() => onView(event)} />)}</div>}</main>
}

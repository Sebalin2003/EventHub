import { useEffect, useState } from 'react'
import type { DemoAction } from '../../demoStore'
import type { DemoState, Event, UserProfile } from '../../types'
import HomePage from './HomePage'
import ExplorePage from './ExplorePage'
import EventDetailPage from './EventDetailPage'
import CheckoutPage from './CheckoutPage'
import ConfirmationPage from './ConfirmationPage'
import MyTicketsPage from './MyTicketsPage'
import FavoritesPage from './FavoritesPage'
import PurchasesPage from './PurchasesPage'
import { useToast } from '../shared/Ui'
import { LanguageSelect, useI18n } from '../../i18n'
import BrandLogo from '../shared/BrandLogo'

type PublicView = 'home' | 'explore' | 'detail' | 'checkout' | 'confirmation' | 'tickets' | 'favorites' | 'purchases'
type PendingIntent = { kind: 'favorite' | 'buy'; eventId: string }

type Props = {
  state: DemoState
  dispatch: React.Dispatch<DemoAction>
  currentUser: UserProfile | null
  onLogin: () => void
  onLogout: () => void
}

const PENDING_KEY = 'eventhub-pending-intent'

export default function PublicPortal({ state, dispatch, currentUser, onLogin, onLogout }: Props) {
  const { notify } = useToast()
  const { t } = useI18n()
  const [view, setView] = useState<PublicView>('home')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [lastOrderId, setLastOrderId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const selectedEvent = state.events.find(event => event.id === selectedEventId) ?? null
  const lastOrder = state.orders.find(order => order.id === lastOrderId) ?? null
  const favoriteIds = currentUser ? state.favoritesByUser[currentUser.id] ?? [] : []
  const myOrders = currentUser ? state.orders.filter(order => order.userId === currentUser.id) : []

  useEffect(() => {
    if (!currentUser) return
    const raw = sessionStorage.getItem(PENDING_KEY)
    if (!raw) return
    sessionStorage.removeItem(PENDING_KEY)
    try {
      const pending = JSON.parse(raw) as PendingIntent
      const event = state.events.find(item => item.id === pending.eventId)
      if (!event) return
      setSelectedEventId(event.id)
      if (pending.kind === 'favorite') {
        if (!(state.favoritesByUser[currentUser.id] ?? []).includes(event.id)) dispatch({ type: 'TOGGLE_FAVORITE', userId: currentUser.id, eventId: event.id })
        notify(t('saved'), 'success')
        setView('detail')
      } else setView('checkout')
    } catch { sessionStorage.removeItem(PENDING_KEY) }
  }, [currentUser?.id])

  useEffect(() => {
    if (!currentUser && ['checkout', 'confirmation', 'favorites', 'tickets', 'purchases'].includes(view)) setView(selectedEvent ? 'detail' : 'home')
  }, [currentUser, selectedEvent, view])

  function navigate(next: PublicView) {
    if (!currentUser && ['favorites', 'tickets', 'purchases'].includes(next)) { onLogin(); return }
    setView(next)
  }

  function viewEvent(event: Event) { setSelectedEventId(event.id); setView('detail') }

  function toggleFavorite(event: Event) {
    if (!currentUser) {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({ kind: 'favorite', eventId: event.id } satisfies PendingIntent))
      onLogin()
      return
    }
    const saved = favoriteIds.includes(event.id)
    dispatch({ type: 'TOGGLE_FAVORITE', userId: currentUser.id, eventId: event.id })
    notify(saved ? t('removed') : t('saved'), 'success')
  }

  function buy(event: Event) {
    if (!currentUser) {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({ kind: 'buy', eventId: event.id } satisfies PendingIntent))
      onLogin()
      return
    }
    setSelectedEventId(event.id)
    setView('checkout')
  }

  const publicNav = [{ key: 'home' as const, label: t('home') }, { key: 'explore' as const, label: t('explore') }]
  const privateNav = currentUser?.role === 'ASISTENTE' ? [
    { key: 'favorites' as const, label: t('favorites') }, { key: 'tickets' as const, label: t('tickets') }, { key: 'purchases' as const, label: t('purchases') },
  ] : []
  const navItems = [...publicNav, ...privateNav]
  const mobileNavValue = navItems.some(item => item.key === view) ? view : selectedEvent ? 'explore' : 'home'

  return <div className="public-app">
    <header className="public-header">
      <div className="public-header__inner">
        <button className="brand" onClick={() => navigate('home')}><BrandLogo /></button>
        <nav className="public-nav" aria-label={t('nav')}>
          {navItems.map(item => <button key={item.key} aria-current={view === item.key ? 'page' : undefined} onClick={() => navigate(item.key)}>{item.label}</button>)}
        </nav>
        <label className="mobile-nav">
          <span className="sr-only">{t('nav')}</span>
          <select aria-label={t('nav')} value={mobileNavValue} onChange={event => navigate(event.target.value as PublicView)}>
            {navItems.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
        </label>
        <div className="session-actions"><LanguageSelect compact />{currentUser ? <><span>{currentUser.name.split(' ')[0]}</span><button className="button button--dark-ghost" onClick={onLogout}>{t('logout')}</button></> : <button className="button button--primary" onClick={onLogin}>{t('login')}</button>}</div>
      </div>
    </header>

    {view === 'home' && <HomePage events={state.events} onViewEvent={viewEvent} onExplore={() => setView('explore')} onSearch={query => { setSearchQuery(query); setView('explore') }} />}
    {view === 'explore' && <ExplorePage events={state.events} initialSearch={searchQuery} onViewEvent={viewEvent} />}
    {view === 'detail' && selectedEvent && <EventDetailPage state={state} event={selectedEvent} currentUser={currentUser} favorite={favoriteIds.includes(selectedEvent.id)} onToggleFavorite={() => toggleFavorite(selectedEvent)} onBack={() => setView('explore')} onHome={() => setView('home')} onBuy={buy} />}
    {view === 'checkout' && selectedEvent && currentUser && <CheckoutPage state={state} event={selectedEvent} currentUser={currentUser} dispatch={dispatch} onComplete={orderId => { setLastOrderId(orderId); setView('confirmation') }} onCancel={() => setView('detail')} onHome={() => setView('home')} />}
    {view === 'confirmation' && lastOrder && selectedEvent && <ConfirmationPage order={lastOrder} event={selectedEvent} onTickets={() => setView('tickets')} onPurchases={() => setView('purchases')} />}
    {view === 'favorites' && currentUser && <FavoritesPage events={state.events} favoriteIds={favoriteIds} onView={viewEvent} onExplore={() => setView('explore')} onHome={() => setView('home')} />}
    {view === 'tickets' && currentUser && <MyTicketsPage orders={myOrders} events={state.events} onHome={() => setView('home')} />}
    {view === 'purchases' && currentUser && <PurchasesPage orders={myOrders} events={state.events} currentUser={currentUser} dispatch={dispatch} onHome={() => setView('home')} onTickets={() => setView('tickets')} />}
  </div>
}

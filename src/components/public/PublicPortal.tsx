import { useState } from 'react'
import type { Event, Order, UserProfile } from '../../types'
import HomePage from './HomePage'
import ExplorePage from './ExplorePage'
import EventDetailPage from './EventDetailPage'
import CheckoutPage from './CheckoutPage'
import ConfirmationPage from './ConfirmationPage'
import MyTicketsPage from './MyTicketsPage'

type PublicView = 'home' | 'explore' | 'detail' | 'checkout' | 'confirmation' | 'tickets'

type Props = {
  events: Event[]
  orders: Order[]
  currentUser: UserProfile | null
  onLogin: () => void
  onLogout: () => void
  onOrderPlaced: (order: Order) => void
}

export default function PublicPortal({ events, orders, currentUser, onLogin, onLogout, onOrderPlaced }: Props) {
  const [view, setView] = useState<PublicView>('home')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [lastOrder, setLastOrder] = useState<Order | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  function handleViewEvent(ev: Event) {
    setSelectedEvent(ev)
    setView('detail')
  }

  function handleBuyTicket(ev: Event) {
    if (!currentUser) { onLogin(); return }
    setSelectedEvent(ev)
    setView('checkout')
  }

  function handleOrderComplete(order: Order) {
    onOrderPlaced(order)
    setLastOrder(order)
    setView('confirmation')
  }

  const navItems = [
    { key: 'home' as PublicView, label: 'Inicio' },
    { key: 'explore' as PublicView, label: 'Explorar' },
    ...(currentUser?.role === 'ASISTENTE' ? [{ key: 'tickets' as PublicView, label: 'Mis entradas' }] : []),
  ]

  return (
    <div style={{ fontFamily: 'var(--font-body)', minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
      {/* Top nav */}
      <header style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-primary)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <button onClick={() => setView('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 600, color: '#F5F3EE', letterSpacing: '-0.02em' }}>EventHub</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--color-accent)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>plataforma</span>
          </button>

          <nav style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
            {navItems.map(item => (
              <button key={item.key} onClick={() => setView(item.key)} style={{
                padding: '0.35rem 0.85rem', borderRadius: 2, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: '0.8rem',
                fontWeight: view === item.key ? 600 : 400,
                backgroundColor: view === item.key ? 'var(--color-accent)' : 'transparent',
                color: view === item.key ? '#fff' : 'rgba(245,243,238,0.75)',
                transition: 'all 0.15s',
              }}>{item.label}</button>
            ))}
            <div style={{ width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 0.5rem' }} />
            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'rgba(245,243,238,0.75)' }}>{currentUser.name.split(' ')[0]}</span>
                <button onClick={onLogout} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 2, padding: '0.3rem 0.7rem', color: 'rgba(245,243,238,0.75)', fontFamily: 'var(--font-body)', fontSize: '0.78rem', cursor: 'pointer' }}>Salir</button>
              </div>
            ) : (
              <button onClick={onLogin} style={{ backgroundColor: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 2, padding: '0.4rem 0.9rem', fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Iniciar sesión</button>
            )}
          </nav>
        </div>
      </header>

      {view === 'home' && (
        <HomePage
          events={events}
          onViewEvent={handleViewEvent}
          onExplore={() => setView('explore')}
          onSearch={q => { setSearchQuery(q); setView('explore') }}
        />
      )}
      {view === 'explore' && (
        <ExplorePage
          events={events}
          initialSearch={searchQuery}
          onViewEvent={handleViewEvent}
        />
      )}
      {view === 'detail' && selectedEvent && (
        <EventDetailPage
          event={selectedEvent}
          onBack={() => setView('explore')}
          onBuy={handleBuyTicket}
          currentUser={currentUser}
        />
      )}
      {view === 'checkout' && selectedEvent && currentUser && (
        <CheckoutPage
          event={selectedEvent}
          currentUser={currentUser}
          onComplete={handleOrderComplete}
          onCancel={() => setView('detail')}
        />
      )}
      {view === 'confirmation' && lastOrder && selectedEvent && (
        <ConfirmationPage
          order={lastOrder}
          event={selectedEvent}
          onDone={() => setView('tickets')}
        />
      )}
      {view === 'tickets' && currentUser && (
        <MyTicketsPage
          orders={orders.filter(o => o.userId === currentUser.id)}
          events={events}
        />
      )}
    </div>
  )
}


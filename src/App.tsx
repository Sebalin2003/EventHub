import { useState } from 'react'
import type { UserProfile, Event, Order } from './types'
import { seedEvents, seedOrders, seedUsers } from './data/seed'
import LoginPage from './components/LoginPage'
import PublicPortal from './components/public/PublicPortal'
import OrganizerPortal from './components/organizer/OrganizerPortal'
import StaffPortal from './components/staff/StaffPortal'
import AdminPortal from './components/admin/AdminPortal'

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [events, setEvents] = useState<Event[]>(seedEvents)
  const [orders, setOrders] = useState<Order[]>(seedOrders)
  const [users] = useState<UserProfile[]>(seedUsers)

  function handleLogin(user: UserProfile) {
    setCurrentUser(user)
    setShowLogin(false)
  }

  function handleLogout() {
    setCurrentUser(null)
    setShowLogin(false)
  }

  function handleOrderPlaced(order: Order) {
    setOrders(prev => [order, ...prev])
    // Update event registered count
    setEvents(prev => prev.map(ev => {
      if (ev.id !== order.eventId) return ev
      const updatedTypes = ev.ticketTypes.map(tt =>
        tt.id === order.ticketTypeId ? { ...tt, sold: tt.sold + order.quantity } : tt
      )
      return { ...ev, registered: ev.registered + order.quantity, ticketTypes: updatedTypes }
    }))
  }

  // Show login page overlay
  if (showLogin && !currentUser) {
    return <LoginPage onLogin={handleLogin} onGuest={() => setShowLogin(false)} />
  }

  // ORGANIZADOR portal
  if (currentUser?.role === 'ORGANIZADOR') {
    return (
      <OrganizerPortal
        events={events}
        orders={orders}
        currentUser={currentUser}
        onLogout={handleLogout}
        onEventsChange={setEvents}
      />
    )
  }

  // STAFF portal
  if (currentUser?.role === 'STAFF') {
    return (
      <StaffPortal
        events={events}
        orders={orders}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    )
  }

  // ADMIN portal
  if (currentUser?.role === 'ADMIN') {
    return (
      <AdminPortal
        users={users}
        events={events}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    )
  }

  // Public portal (VISITANTE, ASISTENTE, or no user)
  return (
    <PublicPortal
      events={events}
      orders={orders}
      currentUser={currentUser}
      onLogin={() => setShowLogin(true)}
      onLogout={handleLogout}
      onOrderPlaced={handleOrderPlaced}
    />
  )
}


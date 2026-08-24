import { useState } from 'react'
import type { Event, Order, UserProfile } from '../../types'
import OrgDashboard from './OrgDashboard'
import OrgEvents from './OrgEvents'
import CreateEventWizard from './CreateEventWizard'
import OrgSales from './OrgSales'
import OrgAttendees from './OrgAttendees'
import OrgCheckIn from './OrgCheckIn'

type OrgTab = 'dashboard' | 'eventos' | 'crear' | 'ventas' | 'asistentes' | 'checkin'

type Props = {
  events: Event[]
  orders: Order[]
  currentUser: UserProfile
  onLogout: () => void
  onEventsChange: (events: Event[]) => void
}

const NAV: { key: OrgTab; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'eventos', label: 'Eventos' },
  { key: 'ventas', label: 'Ventas' },
  { key: 'asistentes', label: 'Asistentes' },
  { key: 'checkin', label: 'Check-in' },
  { key: 'crear', label: 'Crear evento' },
]

export default function OrganizerPortal({ events, orders, currentUser, onLogout, onEventsChange }: Props) {
  const [tab, setTab] = useState<OrgTab>('dashboard')
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)

  const myEvents = events.filter(e => e.organizerId === currentUser.id)
  const myOrders = orders.filter(o => myEvents.some(e => e.id === o.eventId))

  function handleSaveEvent(ev: Event) {
    const exists = events.find(e => e.id === ev.id)
    if (exists) {
      onEventsChange(events.map(e => e.id === ev.id ? ev : e))
    } else {
      onEventsChange([ev, ...events])
    }
    setEditingEvent(null)
    setTab('eventos')
  }

  function handleEdit(ev: Event) {
    setEditingEvent(ev)
    setTab('crear')
  }

  function handleDelete(id: string) {
    onEventsChange(events.filter(e => e.id !== id))
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-body)', backgroundColor: 'var(--color-background)' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, backgroundColor: 'var(--color-primary)', flexShrink: 0, display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: '#F5F3EE', letterSpacing: '-0.02em' }}>EventHub</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--color-accent)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '0.1rem' }}>Organizador</div>
        </div>
        <nav style={{ padding: '1rem 0', flex: 1 }}>
          {NAV.map(item => (
            <button key={item.key} onClick={() => { setTab(item.key); if (item.key !== 'crear') setEditingEvent(null) }} style={{
              display: 'block', width: '100%', textAlign: 'left', padding: '0.7rem 1.25rem',
              border: 'none', background: tab === item.key ? 'rgba(255,255,255,0.1)' : 'none',
              borderLeft: `3px solid ${tab === item.key ? 'var(--color-accent)' : 'transparent'}`,
              color: tab === item.key ? '#F5F3EE' : 'rgba(245,243,238,0.6)',
              fontFamily: 'var(--font-body)', fontSize: '0.85rem', fontWeight: tab === item.key ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.12s',
            }}>
              {item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ margin: '0 0 0.25rem', fontSize: '0.82rem', color: 'rgba(245,243,238,0.8)', fontWeight: 600 }}>{currentUser.name}</p>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.72rem', color: 'rgba(245,243,238,0.45)' }}>{currentUser.email}</p>
          <button onClick={onLogout} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 2, padding: '0.35rem 0.75rem', color: 'rgba(245,243,238,0.65)', fontFamily: 'var(--font-body)', fontSize: '0.75rem', cursor: 'pointer', width: '100%' }}>Cerrar sesión</button>
        </div>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, padding: '2.5rem', minWidth: 0, overflowY: 'auto' }}>
        {tab === 'dashboard' && <OrgDashboard events={myEvents} orders={myOrders} onNew={() => setTab('crear')} />}
        {tab === 'eventos' && <OrgEvents events={myEvents} onEdit={handleEdit} onDelete={handleDelete} onNew={() => setTab('crear')} />}
        {tab === 'crear' && <CreateEventWizard editing={editingEvent} organizerId={currentUser.id} organizerName={currentUser.name} onSave={handleSaveEvent} onCancel={() => setTab('eventos')} />}
        {tab === 'ventas' && <OrgSales events={myEvents} orders={myOrders} />}
        {tab === 'asistentes' && <OrgAttendees events={myEvents} orders={myOrders} />}
        {tab === 'checkin' && <OrgCheckIn events={myEvents} orders={myOrders} />}
      </main>
    </div>
  )
}


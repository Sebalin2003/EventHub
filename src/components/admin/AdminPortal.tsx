import { useState } from 'react'
import type { UserProfile, Event } from '../../types'

type AdminTab = 'usuarios' | 'organizadores' | 'eventos' | 'auditoria'

type Props = {
  users: UserProfile[]
  events: Event[]
  currentUser: UserProfile
  onLogout: () => void
}

const NAV: { key: AdminTab; label: string }[] = [
  { key: 'usuarios', label: 'Usuarios' },
  { key: 'organizadores', label: 'Organizadores' },
  { key: 'eventos', label: 'Eventos' },
  { key: 'auditoria', label: 'Auditoría' },
]

const ROLE_META: Record<string, { bg: string; color: string }> = {
  ASISTENTE: { bg: '#e8edf5', color: '#1B2A4A' },
  ORGANIZADOR: { bg: '#e6f4ea', color: '#1a6e2e' },
  STAFF: { bg: '#fff3cd', color: '#7d5c00' },
  ADMIN: { bg: '#fde8e8', color: '#a02020' },
  VISITANTE: { bg: '#eee', color: '#555' },
}

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  publicado: { label: 'Publicado', bg: '#e6f4ea', color: '#1a6e2e' },
  borrador: { label: 'Borrador', bg: '#fff3cd', color: '#7d5c00' },
  cancelado: { label: 'Cancelado', bg: '#fde8e8', color: '#a02020' },
  finalizado: { label: 'Finalizado', bg: '#e8edf5', color: '#1B2A4A' },
}

const AUDIT_LOG = [
  { id: '1', user: 'org@techmadrid.es', action: 'EVENTO_PUBLICADO', detail: 'Cumbre de Innovación Digital 2026', time: '2026-07-01T10:23:00' },
  { id: '2', user: 'maria@eventHub.com', action: 'COMPRA_CONFIRMADA', detail: 'ORD-1720602180000 · €915.96', time: '2026-07-10T10:23:00' },
  { id: '3', user: 'hola@devacademy.es', action: 'EVENTO_PUBLICADO', detail: 'Workshop: Diseño de Sistemas Escalables', time: '2026-07-15T09:00:00' },
  { id: '4', user: 'javier@eventHub.com', action: 'COMPRA_CONFIRMADA', detail: 'ORD-1720785900000 · €206.96', time: '2026-07-12T14:05:00' },
  { id: '5', user: 'org@techmadrid.es', action: 'EVENTO_CREADO', detail: 'Festival de Jazz de Bilbao', time: '2026-06-01T16:30:00' },
  { id: '6', user: 'admin@eventHub.com', action: 'USUARIO_SUSPENDIDO', detail: 'marcos@email.com', time: '2026-08-01T11:00:00' },
]

const ACTION_META: Record<string, { bg: string; color: string }> = {
  EVENTO_PUBLICADO: { bg: '#e6f4ea', color: '#1a6e2e' },
  EVENTO_CREADO: { bg: '#e8edf5', color: '#1B2A4A' },
  COMPRA_CONFIRMADA: { bg: '#e8f4ff', color: '#1B4A7A' },
  USUARIO_SUSPENDIDO: { bg: '#fde8e8', color: '#a02020' },
}

export default function AdminPortal({ users, events, currentUser, onLogout }: Props) {
  const [tab, setTab] = useState<AdminTab>('usuarios')

  const organizers = users.filter(u => u.role === 'ORGANIZADOR')
  const regularUsers = users.filter(u => u.role !== 'ADMIN')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-body)', backgroundColor: 'var(--color-background)' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, backgroundColor: '#0F1A2E', flexShrink: 0, display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: '#F5F3EE' }}>EventHub</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#FF8A8A', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '0.1rem' }}>Administrador</div>
        </div>
        <nav style={{ padding: '1rem 0', flex: 1 }}>
          {NAV.map(item => (
            <button key={item.key} onClick={() => setTab(item.key)} style={{
              display: 'block', width: '100%', textAlign: 'left', padding: '0.7rem 1.25rem',
              border: 'none', background: tab === item.key ? 'rgba(255,255,255,0.08)' : 'none',
              borderLeft: `3px solid ${tab === item.key ? '#FF8A8A' : 'transparent'}`,
              color: tab === item.key ? '#F5F3EE' : 'rgba(245,243,238,0.5)',
              fontFamily: 'var(--font-body)', fontSize: '0.85rem', fontWeight: tab === item.key ? 600 : 400, cursor: 'pointer',
            }}>{item.label}</button>
          ))}
        </nav>
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ margin: '0 0 0.25rem', fontSize: '0.82rem', color: 'rgba(245,243,238,0.8)', fontWeight: 600 }}>{currentUser.name}</p>
          <button onClick={onLogout} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 2, padding: '0.35rem 0.75rem', color: 'rgba(245,243,238,0.5)', fontFamily: 'var(--font-body)', fontSize: '0.75rem', cursor: 'pointer', width: '100%', marginTop: '0.5rem' }}>Cerrar sesión</button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '2.5rem', minWidth: 0 }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Usuarios', value: users.length },
            { label: 'Organizadores', value: organizers.length },
            { label: 'Eventos', value: events.length },
            { label: 'Publicados', value: events.filter(e => e.status === 'publicado').length },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '1.25rem 1.5rem' }}>
              <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)' }}>{s.label}</p>
              <p style={{ margin: '0.4rem 0 0', fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--color-primary)', lineHeight: 1 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {tab === 'usuarios' && (
          <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, margin: 0, color: 'var(--color-primary)' }}>Usuarios</h2>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-secondary)' }}>
                  {['Nombre', 'Email', 'Rol', 'Registro', 'Estado'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {regularUsers.map(u => {
                  const rm = ROLE_META[u.role] ?? { bg: '#eee', color: '#333' }
                  return (
                    <tr key={u.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</td>
                      <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.82rem', color: 'var(--color-muted-foreground)' }}>{u.email}</td>
                      <td style={{ padding: '0.85rem 1.25rem' }}><span style={{ backgroundColor: rm.bg, color: rm.color, fontSize: '0.68rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', padding: '0.15rem 0.55rem', borderRadius: 2 }}>{u.role}</span></td>
                      <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.8rem', color: 'var(--color-muted-foreground)' }}>{new Date(u.joinedAt).toLocaleDateString('es')}</td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <span style={{ backgroundColor: u.active ? '#e6f4ea' : '#fde8e8', color: u.active ? '#1a6e2e' : '#a02020', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', padding: '0.15rem 0.55rem', borderRadius: 2 }}>
                          {u.active ? 'Activo' : 'Suspendido'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'organizadores' && (
          <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, margin: 0, color: 'var(--color-primary)' }}>Organizadores</h2>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-secondary)' }}>
                  {['Nombre', 'Email', 'Eventos', 'Estado'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {organizers.map(u => {
                  const orgEvents = events.filter(e => e.organizerId === u.id)
                  return (
                    <tr key={u.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</td>
                      <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.82rem', color: 'var(--color-muted-foreground)' }}>{u.email}</td>
                      <td style={{ padding: '0.85rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{orgEvents.length} eventos · {orgEvents.filter(e => e.status === 'publicado').length} publicados</td>
                      <td style={{ padding: '0.85rem 1.25rem' }}><span style={{ backgroundColor: u.active ? '#e6f4ea' : '#fde8e8', color: u.active ? '#1a6e2e' : '#a02020', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', padding: '0.15rem 0.55rem', borderRadius: 2 }}>{u.active ? 'Activo' : 'Suspendido'}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'eventos' && (
          <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, margin: 0, color: 'var(--color-primary)' }}>Todos los eventos</h2>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-secondary)' }}>
                  {['Evento', 'Organizador', 'Ciudad', 'Fecha', 'Estado', 'Entradas'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map(ev => {
                  const sm = STATUS_META[ev.status] ?? { label: ev.status, bg: '#eee', color: '#333' }
                  return (
                    <tr key={ev.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, fontSize: '0.875rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</td>
                      <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.82rem', color: 'var(--color-muted-foreground)' }}>{ev.organizerName}</td>
                      <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.82rem', color: 'var(--color-muted-foreground)' }}>{ev.city}</td>
                      <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{new Date(ev.date).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td style={{ padding: '0.85rem 1.25rem' }}><span style={{ backgroundColor: sm.bg, color: sm.color, fontSize: '0.68rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', padding: '0.15rem 0.55rem', borderRadius: 2 }}>{sm.label}</span></td>
                      <td style={{ padding: '0.85rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{ev.registered}/{ev.capacity}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'auditoria' && (
          <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, margin: 0, color: 'var(--color-primary)' }}>Registro de auditoría</h2>
            </div>
            <div>
              {AUDIT_LOG.map((entry, i) => {
                const am = ACTION_META[entry.action] ?? { bg: '#eee', color: '#333' }
                return (
                  <div key={entry.id} style={{ padding: '1rem 1.5rem', borderBottom: i < AUDIT_LOG.length - 1 ? '1px solid var(--color-border)' : 'none', display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                    <div style={{ flexShrink: 0, paddingTop: '0.15rem' }}>
                      <span style={{ backgroundColor: am.bg, color: am.color, fontSize: '0.62rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', padding: '0.2rem 0.55rem', borderRadius: 2, whiteSpace: 'nowrap' }}>{entry.action}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>{entry.detail}</p>
                      <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-mono)' }}>{entry.user}</p>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{new Date(entry.time).toLocaleDateString('es', { day: 'numeric', month: 'short' })} {new Date(entry.time).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}


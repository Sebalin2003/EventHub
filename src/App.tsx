import { useEffect, useState } from 'react'
import { seedUsers } from './data/seed'
import { useDemoStore } from './demoStore'
import LoginPage from './components/LoginPage'
import PublicPortal from './components/public/PublicPortal'
import OrganizerPortal from './components/organizer/OrganizerPortal'
import StaffPortal from './components/staff/StaffPortal'
import AdminPortal from './components/admin/AdminPortal'
import { BackToTop, ConfirmDialog, SkeletonPage, ToastProvider } from './components/shared/Ui'
import { I18nProvider, useI18n } from './i18n'

function EvenHubApp() {
  const { state, dispatch } = useDemoStore()
  const [showLogin, setShowLogin] = useState(false)
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const [hydrating, setHydrating] = useState(true)
  const { t } = useI18n()
  const currentUser = seedUsers.find(user => user.id === state.currentUserId) ?? null

  useEffect(() => {
    const timer = window.setTimeout(() => setHydrating(false), 320)
    return () => window.clearTimeout(timer)
  }, [])

  if (hydrating) return <SkeletonPage rows={4} />

  if (showLogin && !currentUser) {
    return <LoginPage
      onLogin={user => { dispatch({ type: 'LOGIN', userId: user.id }); setShowLogin(false) }}
      onGuest={() => setShowLogin(false)}
      onReset={() => dispatch({ type: 'RESET' })}
    />
  }

  const requestLogout = () => setConfirmingLogout(true)
  const confirmLogout = () => { dispatch({ type: 'LOGOUT' }); setShowLogin(false); setConfirmingLogout(false) }
  const withLogoutDialog = (content: React.ReactNode) => <>{content}<ConfirmDialog open={confirmingLogout} title={t('logoutTitle')} message={t('logoutMessage')} confirmLabel={t('logoutConfirm')} cancelLabel={t('cancel')} onConfirm={confirmLogout} onCancel={() => setConfirmingLogout(false)} /></>

  if (currentUser?.role === 'ORGANIZADOR') {
    return withLogoutDialog(<OrganizerPortal
      events={state.events}
      orders={state.orders}
      currentUser={currentUser}
      onLogout={requestLogout}
      onUpsertEvent={event => dispatch({ type: 'UPSERT_EVENT', event, actorLabel: currentUser.name })}
      onSetEventStatus={(eventId, status) => dispatch({ type: 'SET_EVENT_STATUS', eventId, status, actorId: currentUser.id, actorLabel: currentUser.name })}
    />)
  }

  if (currentUser?.role === 'STAFF') {
    return withLogoutDialog(<StaffPortal
      events={state.events}
      orders={state.orders}
      currentUser={currentUser}
      checkIns={state.checkIns}
      onCheckIn={record => dispatch({ type: 'CHECK_IN', record, operatorLabel: currentUser.name })}
      onLogout={requestLogout}
    />)
  }

  if (currentUser?.role === 'ADMIN') {
    return withLogoutDialog(<AdminPortal users={seedUsers} events={state.events} audit={state.audit} currentUser={currentUser} onLogout={requestLogout} />)
  }

  return withLogoutDialog(<PublicPortal
    state={state}
    dispatch={dispatch}
    currentUser={currentUser}
    onLogin={() => setShowLogin(true)}
    onLogout={requestLogout}
  />)
}

export default function App() {
  return <I18nProvider><ToastProvider><EvenHubApp /><BackToTop /></ToastProvider></I18nProvider>
}

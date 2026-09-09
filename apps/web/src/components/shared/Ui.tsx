import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useI18n } from '../../i18n'

type ToastTone = 'success' | 'error' | 'info'
type Toast = { id: string; message: string; tone: ToastTone }
type ToastApi = { notify: (message: string, tone?: ToastTone) => void }

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  const [toasts, setToasts] = useState<Toast[]>([])
  const dismiss = useCallback((id: string) => setToasts(items => items.filter(item => item.id !== id)), [])
  const notify = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = crypto.randomUUID()
    setToasts(items => [...items, { id, message, tone }])
    window.setTimeout(() => dismiss(id), tone === 'error' ? 7000 : 4500)
  }, [dismiss])
  const value = useMemo(() => ({ notify }), [notify])
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" aria-label={t('notifications')}>
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast--${toast.tone}`} role={toast.tone === 'error' ? 'alert' : 'status'} aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}>
            <span aria-hidden="true">{toast.tone === 'success' ? '✓' : toast.tone === 'error' ? '!' : 'i'}</span>
            <p>{toast.message}</p>
            <button type="button" onClick={() => dismiss(toast.id)} aria-label={t('closeNotification')}>×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast must be used inside ToastProvider')
  return value
}

export type Crumb = { label: string; onClick?: () => void }
export function Breadcrumb({ items }: { items: Crumb[] }) {
  const { t } = useI18n()
  return (
    <nav className="breadcrumbs" aria-label={t('breadcrumbs')}>
      <ol>
        {items.map((item, index) => {
          const current = index === items.length - 1
          return <li key={`${item.label}-${index}`}>
            {current ? <span aria-current="page">{item.label}</span> : <button type="button" onClick={item.onClick}>{item.label}</button>}
          </li>
        })}
      </ol>
    </nav>
  )
}

export function SkeletonPage({ rows = 3 }: { rows?: number }) {
  return (
    <div className="page-shell skeleton-page" aria-hidden="true">
      <div className="skeleton skeleton-title" />
      <div className="skeleton-grid">
        {Array.from({ length: rows }, (_, index) => <div key={index} className="skeleton skeleton-card" />)}
      </div>
    </div>
  )
}

export function EmptyState({ title, message, action, onAction }: { title: string; message: string; action?: string; onAction?: () => void }) {
  return (
    <section className="empty-state">
      <span className="empty-state__mark" aria-hidden="true">◇</span>
      <h2>{title}</h2>
      <p>{message}</p>
      {action && onAction && <button className="button button--secondary" type="button" onClick={onAction}>{action}</button>}
    </section>
  )
}

export function StatusBadge({ children, tone = 'info' }: { children: ReactNode; tone?: 'success' | 'danger' | 'warning' | 'info' }) {
  return <span className={`status-badge status-badge--${tone}`}>{children}</span>
}

export function BackToTop() {
  const { t } = useI18n()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const updateVisibility = () => setVisible((document.scrollingElement?.scrollTop ?? window.scrollY) > 360)
    updateVisibility()
    window.addEventListener('scroll', updateVisibility, { passive: true })
    return () => window.removeEventListener('scroll', updateVisibility)
  }, [])

  if (!visible) return null

  return <button
    className="back-to-top"
    type="button"
    aria-label={t('backToTop')}
    title={t('backToTop')}
    onClick={() => document.scrollingElement?.scrollTo({
      top: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })}
  ><span aria-hidden="true">↑</span></button>
}

export function ConfirmDialog({ open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel }: { open: boolean; title: string; message: string; confirmLabel: string; cancelLabel: string; onConfirm: () => void; onCancel: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])
  return <dialog ref={ref} className="confirm-dialog" onCancel={event => { event.preventDefault(); onCancel() }}>
    <h2>{title}</h2><p>{message}</p>
    <div><button className="button button--ghost" type="button" onClick={onCancel}>{cancelLabel}</button><button className="button button--primary" type="button" onClick={onConfirm}>{confirmLabel}</button></div>
  </dialog>
}

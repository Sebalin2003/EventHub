import { useState, useEffect } from 'react'
import type { Event, EventCategory, EventStatus } from '../types'

type Props = {
  onSave: (ev: Event) => void
  onCancel: () => void
  editing: Event | null
}

const blankForm = {
  title: '',
  description: '',
  date: '',
  endDate: '',
  location: '',
  capacity: '',
  price: '',
  category: 'conferencia' as EventCategory,
  status: 'borrador' as EventStatus,
  organizer: '',
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', marginBottom: '0.4rem' }}>{label}</label>
      {children}
      {error && <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#a02020' }}>{error}</p>}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.85rem',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.875rem',
  backgroundColor: '#fff',
  color: 'var(--color-foreground)',
  outline: 'none',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
}

export default function CreateEvent({ onSave, onCancel, editing }: Props) {
  const [form, setForm] = useState(blankForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title,
        description: editing.description,
        date: editing.date,
        endDate: editing.endDate,
        location: editing.location,
        capacity: String(editing.capacity),
        price: String(editing.price),
        category: editing.category,
        status: editing.status,
        organizer: editing.organizer,
      })
    } else {
      setForm(blankForm)
    }
    setErrors({})
  }, [editing])

  function set(field: string, val: string) {
    setForm(prev => ({ ...prev, [field]: val }))
    setErrors(prev => { const e = { ...prev }; delete e[field]; return e })
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'El título es obligatorio'
    if (!form.date) e.date = 'La fecha de inicio es obligatoria'
    if (!form.location.trim()) e.location = 'La ubicación es obligatoria'
    if (!form.capacity || isNaN(Number(form.capacity)) || Number(form.capacity) < 1) e.capacity = 'Capacidad debe ser un número positivo'
    if (!form.organizer.trim()) e.organizer = 'El organizador es obligatorio'
    return e
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    const ev: Event = {
      id: editing?.id ?? `e${Date.now()}`,
      title: form.title.trim(),
      description: form.description.trim(),
      date: form.date,
      endDate: form.endDate,
      location: form.location.trim(),
      capacity: Number(form.capacity),
      registered: editing?.registered ?? 0,
      category: form.category,
      status: form.status,
      price: Number(form.price) || 0,
      organizer: form.organizer.trim(),
    }
    onSave(ev)
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--color-primary)', margin: 0 }}>
          {editing ? 'Editar Evento' : 'Crear Nuevo Evento'}
        </h1>
        <p style={{ color: 'var(--color-muted-foreground)', marginTop: '0.35rem', fontSize: '0.9rem' }}>
          {editing ? `Modificando: ${editing.title}` : 'Completa los datos para publicar o guardar como borrador.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '2rem' }}>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <Field label="Título del evento" error={errors.title}>
            <input style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="p.ej. Cumbre de Innovación 2026" />
          </Field>

          <Field label="Descripción">
            <textarea
              style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe el evento, programa, ponentes..."
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="Fecha y hora de inicio" error={errors.date}>
              <input type="datetime-local" style={inputStyle} value={form.date} onChange={e => set('date', e.target.value)} />
            </Field>
            <Field label="Fecha y hora de fin">
              <input type="datetime-local" style={inputStyle} value={form.endDate} onChange={e => set('endDate', e.target.value)} />
            </Field>
          </div>

          <Field label="Ubicación" error={errors.location}>
            <input style={inputStyle} value={form.location} onChange={e => set('location', e.target.value)} placeholder="p.ej. Centro de Convenciones Madrid" />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <Field label="Capacidad máxima" error={errors.capacity}>
              <input type="number" min={1} style={inputStyle} value={form.capacity} onChange={e => set('capacity', e.target.value)} placeholder="500" />
            </Field>
            <Field label="Precio (€)">
              <input type="number" min={0} step={0.01} style={inputStyle} value={form.price} onChange={e => set('price', e.target.value)} placeholder="0 = Gratis" />
            </Field>
            <Field label="Categoría">
              <select style={inputStyle} value={form.category} onChange={e => set('category', e.target.value as EventCategory)}>
                <option value="conferencia">Conferencia</option>
                <option value="taller">Taller</option>
                <option value="networking">Networking</option>
                <option value="webinar">Webinar</option>
                <option value="concierto">Concierto</option>
                <option value="exposición">Exposición</option>
              </select>
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="Organizador" error={errors.organizer}>
              <input style={inputStyle} value={form.organizer} onChange={e => set('organizer', e.target.value)} placeholder="Nombre de la organización" />
            </Field>
            <Field label="Estado">
              <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value as EventStatus)}>
                <option value="borrador">Borrador</option>
                <option value="publicado">Publicado</option>
                <option value="cancelado">Cancelado</option>
                <option value="finalizado">Finalizado</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--color-border)', margin: '2rem 0 1.5rem' }} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" onClick={onCancel} style={{ padding: '0.65rem 1.25rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: '0.875rem', cursor: 'pointer', color: 'var(--color-foreground)' }}>
            Cancelar
          </button>
          <button type="submit" style={{ padding: '0.65rem 1.5rem', border: 'none', borderRadius: 'var(--radius)', backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
            {editing ? 'Guardar cambios' : 'Crear evento'}
          </button>
        </div>
      </form>
    </div>
  )
}


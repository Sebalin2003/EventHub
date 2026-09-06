import { useState, useEffect } from 'react'
import type { Event, EventCategory, EventModality, EventStatus, Seat, SeatingMode, Sector, TicketType } from '../../types'

type Props = {
  editing: Event | null
  organizerId: string
  organizerName: string
  onSave: (ev: Event) => void
  onCancel: () => void
}

type Step = 1 | 2 | 3 | 4 | 5
const STEPS = [
  { num: 1 as Step, label: 'Información' },
  { num: 2 as Step, label: 'Ubicación' },
  { num: 3 as Step, label: 'Entradas' },
  { num: 4 as Step, label: 'Configuración' },
  { num: 5 as Step, label: 'Publicación' },
]

type TT = { name: string; description: string; price: string; quantity: string }
const blankTT = (): TT => ({ name: '', description: '', price: '', quantity: '' })

const fieldStyle: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.85rem', border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', fontSize: '0.875rem',
  backgroundColor: '#fff', color: 'var(--color-foreground)', outline: 'none', boxSizing: 'border-box',
}

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', marginBottom: '0.4rem' }}>{children}</label>
}

export default function CreateEventWizard({ editing, organizerId, organizerName, onSave, onCancel }: Props) {
  const [step, setStep] = useState<Step>(1)

  // Step 1
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<EventCategory>('conferencia')
  const [imageUrl, setImageUrl] = useState('')
  const [date, setDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Step 2
  const [venueName, setVenueName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [modality, setModality] = useState<EventModality>('presencial')
  const [capacity, setCapacity] = useState('')

  // Step 3
  const [ticketTypes, setTicketTypes] = useState<TT[]>([blankTT()])

  // Step 4
  const [saleCutoff, setSaleCutoff] = useState('')
  const [maxPerUser, setMaxPerUser] = useState('4')
  const [cancelPolicy, setCancelPolicy] = useState('Reembolso completo hasta 7 días antes del evento.')
  const [seatingMode, setSeatingMode] = useState<SeatingMode>('general')

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (editing) {
      setTitle(editing.title); setDescription(editing.description); setCategory(editing.category)
      setImageUrl(editing.imageUrl ?? ''); setDate(editing.date); setEndDate(editing.endDate)
      setVenueName(editing.venueName); setAddress(editing.address); setCity(editing.city)
      setModality(editing.modality); setCapacity(String(editing.capacity))
      setTicketTypes(editing.ticketTypes.map(t => ({ name: t.name, description: t.description, price: String(t.price), quantity: String(t.totalQuantity) })))
      setSaleCutoff(editing.saleCutoffDate ?? ''); setMaxPerUser(String(editing.maxTicketsPerUser))
      setCancelPolicy(editing.cancellationPolicy); setSeatingMode(editing.seatingMode ?? 'general'); setStep(1)
    } else {
      setTitle(''); setDescription(''); setCategory('conferencia'); setImageUrl(''); setDate(''); setEndDate('')
      setVenueName(''); setAddress(''); setCity(''); setModality('presencial'); setCapacity('')
      setTicketTypes([blankTT()]); setSaleCutoff(''); setMaxPerUser('4')
      setCancelPolicy('Reembolso completo hasta 7 días antes del evento.'); setSeatingMode('general'); setStep(1)
    }
    setErrors({})
  }, [editing])

  function validateStep() {
    const e: Record<string, string> = {}
    if (step === 1) {
      if (!title.trim()) e.title = 'Requerido'
      if (!date) e.date = 'Requerido'
    }
    if (step === 2) {
      if (!city.trim()) e.city = 'Requerido'
      if (!capacity || Number(capacity) < 1) e.capacity = 'Capacidad inválida'
      if (modality !== 'online' && !venueName.trim()) e.venueName = 'Requerido'
    }
    if (step === 3) {
      ticketTypes.forEach((t, i) => {
        if (!t.name.trim()) e[`tt_name_${i}`] = 'Requerido'
        if (!t.quantity || Number(t.quantity) < 1) e[`tt_qty_${i}`] = 'Inválido'
      })
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function next() { if (validateStep()) setStep(s => Math.min(5, s + 1) as Step) }
  function prev() { setStep(s => Math.max(1, s - 1) as Step) }

  function handlePublish(status: EventStatus) {
    const eventId = editing?.id ?? `e${Date.now()}`
    const tts: TicketType[] = ticketTypes.map((t, i) => ({
      id: editing?.ticketTypes[i]?.id ?? `tt-${Date.now()}-${i}`,
      eventId,
      name: t.name,
      description: t.description,
      price: Number(t.price) || 0,
      totalQuantity: Number(t.quantity),
      sold: editing?.ticketTypes[i]?.sold ?? 0,
      status: 'DISPONIBLE' as const,
    }))
    const sectors: Sector[] = seatingMode === 'numbered' ? tts.map((ticket, index) => ({ id: `${eventId}-sector-${index + 1}`, name: ticket.name, ticketTypeId: ticket.id, rows: ['A', 'B'] })) : []
    const seats: Seat[] = sectors.flatMap(sector => sector.rows.flatMap(row => Array.from({ length: 6 }, (_, index) => ({ id: `${eventId}-${sector.id}-${row}-${index + 1}`, eventId, sectorId: sector.id, row, number: index + 1, ticketTypeId: sector.ticketTypeId, status: 'available' as const }))))
    const ev: Event = {
      id: eventId,
      title, description, category, modality,
      date, endDate, venueName, address, city,
      capacity: Number(capacity),
      registered: editing?.registered ?? 0,
      status,
      organizerId, organizerName,
      imageUrl: imageUrl || undefined,
      ticketTypes: tts,
      saleCutoffDate: saleCutoff || undefined,
      maxTicketsPerUser: Number(maxPerUser) || 4,
      cancellationPolicy: cancelPolicy,
      featured: editing?.featured ?? false,
      checkIns: editing?.checkIns ?? 0,
      seatingMode,
      sectors,
      seats,
    }
    tts.forEach(t => { t.eventId = ev.id })
    onSave(ev)
  }

  return (
    <div style={{ maxWidth: 740, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--color-primary)', margin: 0 }}>
          {editing ? 'Editar evento' : 'Crear nuevo evento'}
        </h1>
        <p style={{ color: 'var(--color-muted-foreground)', marginTop: '0.35rem', fontSize: '0.875rem' }}>Completa los pasos para configurar tu evento.</p>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 0, marginBottom: '2rem', borderBottom: '1px solid var(--color-border)' }}>
        {STEPS.map((s, i) => (
          <div key={s.num} style={{ flex: 1, textAlign: 'center', paddingBottom: '0.85rem', borderBottom: `2px solid ${step === s.num ? 'var(--color-accent)' : step > s.num ? 'var(--color-primary)' : 'transparent'}`, transition: 'border-color 0.2s', cursor: step > s.num ? 'pointer' : 'default' }} onClick={() => step > s.num && setStep(s.num)}>
            <span style={{ display: 'inline-flex', width: 24, height: 24, borderRadius: '50%', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', backgroundColor: step > s.num ? 'var(--color-primary)' : step === s.num ? 'var(--color-accent)' : 'var(--color-muted)', color: step >= s.num ? '#fff' : 'var(--color-muted-foreground)', marginBottom: '0.3rem' }}>
              {step > s.num ? '✓' : s.num}
            </span>
            <p style={{ margin: 0, fontSize: '0.72rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', color: step === s.num ? 'var(--color-foreground)' : 'var(--color-muted-foreground)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '2rem' }}>
        {/* Step 1: Info */}
        {step === 1 && (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <div><Label>Nombre del evento *</Label><input style={fieldStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="Cumbre de Innovación 2026" />{errors.title && <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#a02020' }}>{errors.title}</p>}</div>
            <div><Label>Descripción</Label><textarea style={{ ...fieldStyle, minHeight: 90, resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe el evento..." /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><Label>Categoría</Label>
                <select style={fieldStyle} value={category} onChange={e => setCategory(e.target.value as EventCategory)}>
                  {[['conferencia','Conferencia'],['taller','Taller'],['networking','Networking'],['webinar','Webinar'],['concierto','Concierto'],['exposicion','Exposición']].map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div><Label>URL de imagen (opcional)</Label><input style={fieldStyle} value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><Label>Fecha y hora de inicio *</Label><input type="datetime-local" style={fieldStyle} value={date} onChange={e => setDate(e.target.value)} />{errors.date && <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#a02020' }}>{errors.date}</p>}</div>
              <div><Label>Fecha y hora de fin</Label><input type="datetime-local" style={fieldStyle} value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <div><Label>Modalidad</Label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['presencial','online','hibrido'] as EventModality[]).map(m => (
                  <button key={m} type="button" onClick={() => setModality(m)} style={{ flex: 1, padding: '0.55rem', border: `2px solid ${modality === m ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: 'var(--radius)', backgroundColor: modality === m ? 'var(--color-secondary)' : '#fff', fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: modality === m ? 600 : 400, cursor: 'pointer', textTransform: 'capitalize' }}>{m}</button>
                ))}
              </div>
            </div>
            {modality !== 'online' && <>
              <div><Label>Nombre del recinto *</Label><input style={fieldStyle} value={venueName} onChange={e => setVenueName(e.target.value)} placeholder="Centro de Convenciones..." />{errors.venueName && <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#a02020' }}>{errors.venueName}</p>}</div>
              <div><Label>Dirección</Label><input style={fieldStyle} value={address} onChange={e => setAddress(e.target.value)} placeholder="Calle, número, código postal" /></div>
            </>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><Label>Ciudad *</Label><input style={fieldStyle} value={city} onChange={e => setCity(e.target.value)} placeholder="Madrid" />{errors.city && <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#a02020' }}>{errors.city}</p>}</div>
              <div><Label>Capacidad máxima *</Label><input type="number" min={1} style={fieldStyle} value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="500" />{errors.capacity && <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#a02020' }}>{errors.capacity}</p>}</div>
            </div>
          </div>
        )}

        {/* Step 3: Tickets */}
        {step === 3 && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
              {ticketTypes.map((tt, i) => (
                <div key={i} style={{ padding: '1.1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', backgroundColor: 'var(--color-secondary)', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)' }}>Tipo {i + 1}</span>
                    {ticketTypes.length > 1 && <button onClick={() => setTicketTypes(ts => ts.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#a02020', cursor: 'pointer', fontSize: '0.75rem' }}>Eliminar</button>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div><Label>Nombre *</Label><input style={fieldStyle} value={tt.name} onChange={e => setTicketTypes(ts => ts.map((t, j) => j === i ? { ...t, name: e.target.value } : t))} placeholder="General, VIP, Premium..." />{errors[`tt_name_${i}`] && <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: '#a02020' }}>{errors[`tt_name_${i}`]}</p>}</div>
                    <div><Label>Precio (ARS)</Label><input type="number" min={0} style={fieldStyle} value={tt.price} onChange={e => setTicketTypes(ts => ts.map((t, j) => j === i ? { ...t, price: e.target.value } : t))} placeholder="0" /></div>
                    <div><Label>Cantidad *</Label><input type="number" min={1} style={fieldStyle} value={tt.quantity} onChange={e => setTicketTypes(ts => ts.map((t, j) => j === i ? { ...t, quantity: e.target.value } : t))} placeholder="100" />{errors[`tt_qty_${i}`] && <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: '#a02020' }}>{errors[`tt_qty_${i}`]}</p>}</div>
                  </div>
                  <div><Label>Descripción del tipo</Label><input style={fieldStyle} value={tt.description} onChange={e => setTicketTypes(ts => ts.map((t, j) => j === i ? { ...t, description: e.target.value } : t))} placeholder="¿Qué incluye esta entrada?" /></div>
                </div>
              ))}
            </div>
            <button onClick={() => setTicketTypes(ts => [...ts, blankTT()])} style={{ padding: '0.55rem 1.1rem', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius)', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--color-primary)' }}>+ Añadir tipo de entrada</button>
          </div>
        )}

        {/* Step 4: Config */}
        {step === 4 && (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <div><Label>Tipo de localidades</Label><div style={{ display: 'flex', gap: '0.5rem' }}>{(['general', 'numbered'] as SeatingMode[]).map(mode => <button key={mode} type="button" onClick={() => setSeatingMode(mode)} style={{ flex: 1, padding: '0.65rem', border: `2px solid ${seatingMode === mode ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: 'var(--radius)', background: seatingMode === mode ? 'var(--color-secondary)' : '#fff', fontFamily: 'var(--font-body)', cursor: 'pointer' }}>{mode === 'general' ? 'Entrada general' : 'Asientos numerados'}</button>)}</div>{seatingMode === 'numbered' && <p style={{ fontSize: '0.78rem', color: 'var(--color-muted-foreground)', marginBottom: 0 }}>El demo crea un sector por tipo de entrada, con dos filas de seis asientos.</p>}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><Label>Fecha límite de venta</Label><input type="date" style={fieldStyle} value={saleCutoff} onChange={e => setSaleCutoff(e.target.value)} /></div>
              <div><Label>Límite de entradas por usuario</Label><input type="number" min={1} max={20} style={fieldStyle} value={maxPerUser} onChange={e => setMaxPerUser(e.target.value)} /></div>
            </div>
            <div><Label>Política de cancelación</Label><textarea style={{ ...fieldStyle, minHeight: 80, resize: 'vertical' }} value={cancelPolicy} onChange={e => setCancelPolicy(e.target.value)} /></div>
          </div>
        )}

        {/* Step 5: Preview */}
        {step === 5 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 600, color: 'var(--color-primary)', margin: '0 0 1.5rem' }}>Vista previa y publicación</h2>
            <div style={{ backgroundColor: 'var(--color-secondary)', borderRadius: 'var(--radius)', padding: '1.5rem', marginBottom: '1.5rem', display: 'grid', gap: '0.75rem' }}>
              {[
                { label: 'Título', value: title || '—' },
                { label: 'Fecha', value: date ? new Date(date).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
                { label: 'Ciudad', value: city || '—' },
                { label: 'Capacidad', value: capacity ? `${Number(capacity).toLocaleString()} personas` : '—' },
                { label: 'Tipos de entrada', value: ticketTypes.filter(t => t.name).map(t => `${t.name} (ARS ${Number(t.price || 0).toLocaleString('es-AR')})`).join(', ') || '—' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', gap: '1rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-foreground)', minWidth: 110, paddingTop: '0.1rem' }}>{item.label}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.value}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => handlePublish('borrador')} style={{ flex: 1, padding: '0.75rem', border: '2px solid var(--color-border)', borderRadius: 'var(--radius)', backgroundColor: 'transparent', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', color: 'var(--color-foreground)' }}>
                Guardar como borrador
              </button>
              <button onClick={() => handlePublish('publicado')} style={{ flex: 2, padding: '0.75rem', border: 'none', borderRadius: 'var(--radius)', backgroundColor: 'var(--color-accent)', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                Publicar evento →
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        {step < 5 && (
          <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '2rem', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={step === 1 ? onCancel : prev} style={{ padding: '0.65rem 1.25rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: '0.875rem', cursor: 'pointer' }}>
              {step === 1 ? 'Cancelar' : '← Anterior'}
            </button>
            <button onClick={next} style={{ padding: '0.65rem 1.5rem', border: 'none', borderRadius: 'var(--radius)', backgroundColor: 'var(--color-primary)', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
              Siguiente →
            </button>
          </div>
        )}
        {step === 5 && (
          <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '2rem', paddingTop: '1.5rem' }}>
            <button onClick={prev} style={{ padding: '0.65rem 1.25rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: '0.875rem', cursor: 'pointer' }}>← Anterior</button>
          </div>
        )}
      </div>
    </div>
  )
}

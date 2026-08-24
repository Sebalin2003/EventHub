import { useState } from 'react'
import type { UserRole, UserProfile } from '../types'
import { seedUsers } from '../data/seed'

type Props = {
  onLogin: (user: UserProfile) => void
  onGuest: () => void
}

const ROLE_DEMOS: { role: UserRole; label: string; desc: string; userId: string }[] = [
  { role: 'ASISTENTE', label: 'Asistente', desc: 'Compra entradas, gestiona tus tickets y favoritos', userId: 'u1' },
  { role: 'ORGANIZADOR', label: 'Organizador', desc: 'Crea eventos, gestiona ventas y estadísticas', userId: 'u3' },
  { role: 'STAFF', label: 'Staff', desc: 'Escanea y valida entradas en el recinto', userId: 'u5' },
  { role: 'ADMIN', label: 'Administrador', desc: 'Supervisa usuarios, organizadores y sistema', userId: 'u6' },
]

export default function LoginPage({ onLogin, onGuest }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'demo'>('demo')

  function handleDemoLogin() {
    if (!selected) { setError('Selecciona un perfil de demostración'); return }
    const demo = ROLE_DEMOS.find(r => r.userId === selected)!
    const user = seedUsers.find(u => u.id === demo.userId)!
    onLogin(user)
  }

  function handleManualLogin(e: React.FormEvent) {
    e.preventDefault()
    const user = seedUsers.find(u => u.email === email)
    if (!user) { setError('Usuario no encontrado'); return }
    onLogin(user)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      backgroundColor: 'var(--color-background)',
    }}>
      {/* Top brand bar */}
      <div style={{ borderBottom: '1px solid var(--color-border)', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--color-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 600, color: '#F5F3EE', letterSpacing: '-0.02em' }}>EventHub</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--color-accent)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>plataforma</span>
        </div>
        <button onClick={onGuest} style={{ background: 'none', border: '1px solid rgba(245,243,238,0.3)', borderRadius: 'var(--radius)', padding: '0.4rem 1rem', color: 'rgba(245,243,238,0.8)', fontFamily: 'var(--font-body)', fontSize: '0.8rem', cursor: 'pointer' }}>
          Explorar sin cuenta →
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: 520 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--color-primary)', margin: '0 0 0.5rem' }}>
            Iniciar sesión
          </h1>
          <p style={{ color: 'var(--color-muted-foreground)', margin: '0 0 2rem', fontSize: '0.9rem' }}>
            Accede con tu cuenta o prueba un perfil de demostración.
          </p>

          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 0, marginBottom: '1.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden', width: 'fit-content' }}>
            {(['demo', 'login'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                padding: '0.45rem 1.1rem', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: mode === m ? 600 : 400,
                backgroundColor: mode === m ? 'var(--color-primary)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--color-muted-foreground)',
              }}>
                {m === 'demo' ? 'Demostración' : 'Con credenciales'}
              </button>
            ))}
          </div>

          {mode === 'demo' ? (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {ROLE_DEMOS.map(r => (
                  <button key={r.userId} onClick={() => setSelected(r.userId)} style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1rem 1.25rem',
                    border: `2px solid ${selected === r.userId ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'left',
                    backgroundColor: selected === r.userId ? 'var(--color-secondary)' : 'var(--color-card)',
                    transition: 'all 0.15s',
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                      backgroundColor: selected === r.userId ? 'var(--color-primary)' : 'var(--color-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 500,
                      color: selected === r.userId ? '#fff' : 'var(--color-muted-foreground)',
                      letterSpacing: '0.04em',
                    }}>
                      {r.role.slice(0, 3)}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-foreground)' }}>{r.label}</p>
                      <p style={{ margin: '0.1rem 0 0', fontSize: '0.78rem', color: 'var(--color-muted-foreground)' }}>{r.desc}</p>
                    </div>
                    {selected === r.userId && (
                      <span style={{ marginLeft: 'auto', color: 'var(--color-primary)', fontWeight: 700, fontSize: '1.1rem' }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
              {error && <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#a02020' }}>{error}</p>}
              <button onClick={handleDemoLogin} style={{
                width: '100%', padding: '0.8rem', border: 'none', borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-accent)', color: '#fff', fontFamily: 'var(--font-body)',
                fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
              }}>
                Entrar como {ROLE_DEMOS.find(r => r.userId === selected)?.label ?? '—'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleManualLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', marginBottom: '0.4rem' }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com"
                  style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', backgroundColor: '#fff', color: 'var(--color-foreground)', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', marginBottom: '0.4rem' }}>Contraseña</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', backgroundColor: '#fff', color: 'var(--color-foreground)', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              {error && <p style={{ margin: 0, fontSize: '0.8rem', color: '#a02020' }}>{error}</p>}
              <button type="submit" style={{ padding: '0.8rem', border: 'none', borderRadius: 'var(--radius)', backgroundColor: 'var(--color-primary)', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}>
                Iniciar sesión
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}


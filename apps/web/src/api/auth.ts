import type { UserProfile, UserRole } from '../types'
import { seedUsers } from '../data/seed'

type ApiUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'organizer' | 'staff' | 'attendee'
  createdAt: string
}

type LoginResponse = { accessToken: string; user: ApiUser }

const roleMap: Record<ApiUser['role'], UserRole> = {
  admin: 'ADMIN',
  organizer: 'ORGANIZADOR',
  staff: 'STAFF',
  attendee: 'ASISTENTE',
}

// Los usuarios del seed conservan su id local (u1, u3...) para no perder los datos demo asociados.
function mapUser(user: ApiUser): UserProfile {
  const id = seedUsers.find(seed => seed.email === user.email)?.id ?? user.id
  return {
    id,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    role: roleMap[user.role],
    joinedAt: user.createdAt,
    active: true,
  }
}

export async function login(email: string, password: string): Promise<UserProfile> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) throw new Error('Credenciales inválidas')
  const data = await response.json() as LoginResponse
  localStorage.setItem('eventhub-access-token', data.accessToken)
  return mapUser(data.user)
}

// Perfiles de la pestaña "Demostración": usan las credenciales del seed del backend (contraseña "password")
// para obtener un JWT real. Si la API no está disponible se sigue en modo demo local.
export async function loginDemo(user: UserProfile): Promise<UserProfile> {
  try {
    return await login(user.email, 'password')
  } catch {
    localStorage.removeItem('eventhub-access-token')
    return user
  }
}

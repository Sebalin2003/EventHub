import type { UserProfile, UserRole } from '../types'

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

function mapUser(user: ApiUser): UserProfile {
  return {
    id: user.id,
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

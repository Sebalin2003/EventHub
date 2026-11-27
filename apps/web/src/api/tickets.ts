import { apiUrl } from './client'

export type ApiTicket = {
  id: string
  orderId: string
  eventId: string
  userId: string
  ticketType: string | null
  status: 'ISSUED' | 'EMITTED' | 'USED' | 'SCANNED' | 'CANCELLED'
  code: string
  scannedAt: string | null
  createdAt: string
}

export async function getMyTickets(): Promise<ApiTicket[]> {
  const token = localStorage.getItem('eventhub-access-token')
  const response = await fetch(apiUrl('/api/tickets/me'), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) throw new Error(`No se pudieron cargar las entradas (${response.status})`)
  return response.json()
}

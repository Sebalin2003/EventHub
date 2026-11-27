import { apiUrl } from './client'

export type CheckInApiResult = {
  success: boolean
  result: 'ENTRADA_VALIDA' | 'ENTRADA_YA_UTILIZADA' | 'ENTRADA_INVALIDA' | 'ENTRADA_EVENTO_INCORRECTO'
  ticketId: string
  code: string | null
  eventId: string | null
  scannedAt: string | null
  message: string
}

export async function scanTicket(ticketId: string, eventId: string): Promise<CheckInApiResult> {
  const token = localStorage.getItem('eventhub-access-token')
  const response = await fetch(apiUrl(`/api/check-in/${encodeURIComponent(ticketId)}/scan`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ eventId }),
  })
  const body = await response.json().catch(() => null) as CheckInApiResult | {
    statusCode?: number
    message?: string
  } | null
  if (!response.ok) {
    const message = body && 'message' in body ? body.message : `Escaneo rechazado (${response.status})`
    throw new Error(typeof message === 'string' ? message : 'Escaneo rechazado')
  }
  return body as CheckInApiResult
}

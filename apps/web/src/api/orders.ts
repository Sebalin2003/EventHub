import { apiUrl } from './client'

export class ApiProblemError extends Error {
  status: number
  detail?: string
  retryAfter?: string

  constructor(status: number, detail: string, retryAfter?: string) {
    super(detail)
    this.name = 'ApiProblemError'
    this.status = status
    this.detail = detail
    this.retryAfter = retryAfter
  }
}

async function authed<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('eventhub-access-token')
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(apiUrl(path), { ...init, headers })
  if (!response.ok) {
    const problem = await response.json().catch(() => null) as {
      message?: string | string[]
      detail?: string
      title?: string
    } | null
    const detail = problem?.detail
      ?? (Array.isArray(problem?.message) ? problem.message.join(', ') : problem?.message)
      ?? problem?.title
      ?? `La API respondió con estado ${response.status}`
    throw new ApiProblemError(
      response.status,
      detail,
      response.headers.get('Retry-After') ?? undefined,
    )
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export type ApiOrder = {
  id: string
  userId: string
  status: 'pending' | 'processing' | 'paid' | 'cancelled' | 'refunded'
  total: number | string
  items: Array<{
    eventId: string
    ticketTypeId?: string
    ticketType?: string
    quantity: number
    unitPrice: number | string
  }>
  holds?: Array<{ eventId: string; holdId: string; expiresAt: string }>
  createdAt: string
  version: number
}

export function createOrder(eventId: string, ticketType: string, quantity: number, idempotencyKey: string) {
  return authed<ApiOrder>('/api/orders', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ items: [{ eventId, ticketType, quantity }] }),
  })
}

export function payOrder(orderId: string, card: string) {
  return authed<ApiOrder & { tickets?: unknown[] }>(`/api/orders/${orderId}/pay`, {
    method: 'POST',
    body: JSON.stringify({ card }),
  })
}

export function getOrders() {
  return authed<ApiOrder[]>('/api/orders')
}

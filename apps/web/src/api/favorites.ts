const token = () => localStorage.getItem('eventhub-access-token')
const headers = () => ({ Authorization: `Bearer ${token()}` })

export async function fetchFavorites(): Promise<string[]> {
  const response = await fetch('/api/me/favorites', { headers: headers() })
  if (!response.ok) throw new Error('No se pudieron cargar favoritos')
  const data = await response.json() as Array<{ eventId: string; event?: { legacyId?: string | null } }>
  return data.map(item => item.event?.legacyId ?? item.eventId)
}

export async function addFavorite(eventId: string) {
  const response = await fetch(`/api/me/favorites/${eventId}`, { method: 'PUT', headers: headers() })
  if (!response.ok) throw new Error('No se pudo guardar el favorito')
}

export async function removeFavorite(eventId: string) {
  const response = await fetch(`/api/me/favorites/${eventId}`, { method: 'DELETE', headers: headers() })
  if (!response.ok) throw new Error('No se pudo quitar el favorito')
}

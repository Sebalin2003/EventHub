/**
 * Helper para resolver URLs de la API REST de EventHub.
 *
 * - Si VITE_API_URL está definida (ej. "https://eventhub-api.onrender.com"),
 *   se remueve el prefijo "/api" para llamar directamente a las rutas de NestJS.
 * - Si no está definida (entorno local con proxy Vite o Docker Compose),
 *   se mantiene el prefijo "/api" para que el proxy redirija transparentemente.
 */
export function apiUrl(endpoint: string): string {
  const envUrl = import.meta.env.VITE_API_URL
  if (!envUrl) return endpoint
  const base = String(envUrl).replace(/\/+$/, '')
  const clean = endpoint.startsWith('/api/') ? endpoint.replace(/^\/api/, '') : endpoint
  return `${base}${clean}`
}

import { randomBytes } from 'node:crypto';

let ephemeralSecret: string | undefined;

/**
 * Secreto de firma de los JWT (Eje D / G6).
 *
 * - Siempre se toma de la variable de entorno JWT_SECRET; no hay valores fijos en el código.
 * - En producción es obligatorio.
 * - Fuera de producción, si no se configura, se genera uno aleatorio por proceso:
 *   `docker compose up` sigue funcionando sin pasos extra, pero nadie puede forjar
 *   tokens con un valor publicado en el repositorio. Los tokens dejan de valer al reiniciar.
 */
export function resolveJwtSecret(configured = process.env.JWT_SECRET): string {
  const secret = configured?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }
  ephemeralSecret ??= randomBytes(48).toString('base64url');
  return ephemeralSecret;
}

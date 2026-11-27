import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/** Desarrollo local: localhost o 127.0.0.1 en cualquier puerto, comparado de forma exacta. */
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/;

export function configuredOrigins(): string[] {
  return (process.env.FRONTEND_URL || process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true; // Clientes sin navegador (curl, Postman, servidor a servidor).
  return LOCAL_ORIGIN.test(origin) || configuredOrigins().includes(origin);
}

/**
 * Eje D: configuracion CORS unica, compartida por produccion y las pruebas.
 * Lista exacta de origenes: nunca comodin ni comparaciones por sufijo
 * (antes `endsWith('eventhub.com')` aceptaba https://evileventhub.com y cualquier *.pages.dev).
 * En la nube, el origen del frontend se declara en FRONTEND_URL (separado por comas si son varios).
 */
export const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    callback(null, isAllowedOrigin(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'If-Match', 'X-Requested-With'],
  exposedHeaders: ['ETag'],
};

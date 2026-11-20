import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/**
 * Eje D: configuracion CORS unica, compartida por produccion y las pruebas.
 * Nunca usa comodin (`*`) y solo habilita origenes explicitos con credenciales.
 */
export const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const configuredOrigins = (process.env.FRONTEND_URL || process.env.CORS_ORIGIN || '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    // Allow localhost dev servers, Cloudflare Pages (.pages.dev), eventhub domains, or configured origins
    if (
      !origin ||
      /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
      origin.endsWith('.pages.dev') ||
      origin.endsWith('eventhub.com') ||
      origin.endsWith('eventhub.com.ar') ||
      configuredOrigins.includes(origin)
    ) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'If-Match', 'X-Requested-With'],
  exposedHeaders: ['ETag'],
};

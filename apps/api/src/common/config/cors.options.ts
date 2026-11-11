import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/**
 * Eje D: configuracion CORS unica, compartida por produccion y las pruebas.
 * Nunca usa comodin (`*`) y solo habilita origenes explicitos con credenciales.
 */
export const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow localhost dev servers or same origin
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin) || origin.endsWith('eventhub.com')) {
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

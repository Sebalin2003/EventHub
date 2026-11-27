import { afterEach, describe, expect, it } from 'vitest';
import { isAllowedOrigin } from './cors.options.js';

describe('CORS con lista exacta de orígenes (Eje D)', () => {
  const original = process.env.FRONTEND_URL;

  afterEach(() => {
    process.env.FRONTEND_URL = original;
  });

  it('acepta el frontend local y los orígenes configurados', () => {
    process.env.FRONTEND_URL = 'https://eventhub-web.pages.dev, https://app.eventhub.com.ar/';
    expect(isAllowedOrigin('http://localhost:5173')).toBe(true);
    expect(isAllowedOrigin('http://127.0.0.1:4173')).toBe(true);
    expect(isAllowedOrigin('https://eventhub-web.pages.dev')).toBe(true);
    expect(isAllowedOrigin('https://app.eventhub.com.ar')).toBe(true);
  });

  it.each([
    'https://evileventhub.com',
    'https://atacante.pages.dev',
    'https://x.railway.app',
    'https://eventhub-web.pages.dev.evil.com',
    'http://localhost.evil.com',
    'null',
  ])('rechaza %s', (origin) => {
    process.env.FRONTEND_URL = 'https://eventhub-web.pages.dev';
    expect(isAllowedOrigin(origin)).toBe(false);
  });
});

import { afterEach, describe, expect, it } from 'vitest';
import { resolveJwtSecret } from './jwt-secret.js';

describe('resolveJwtSecret (Eje D: sin secretos en el repositorio)', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('usa el secreto configurado', () => {
    expect(resolveJwtSecret('  secreto-configurado  ')).toBe('secreto-configurado');
  });

  it('fuera de producción genera un secreto aleatorio largo y estable dentro del proceso', () => {
    process.env.NODE_ENV = 'development';
    const first = resolveJwtSecret('');
    expect(first.length).toBeGreaterThanOrEqual(32);
    expect(resolveJwtSecret(undefined)).toBe(first);
    expect(first).not.toBe('development-secret');
  });

  it('en producción exige JWT_SECRET', () => {
    process.env.NODE_ENV = 'production';
    expect(() => resolveJwtSecret('')).toThrow('JWT_SECRET is required in production');
  });
});

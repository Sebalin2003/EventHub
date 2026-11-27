import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resolveJwtSecret } from './jwt-secret.js';

describe('resolveJwtSecret (Eje D: sin secretos en el repositorio)', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSecret = process.env.JWT_SECRET;

  // El test no debe depender del entorno: el CI define JWT_SECRET para el resto de la suite.
  beforeEach(() => {
    delete process.env.JWT_SECRET;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it('usa el secreto configurado', () => {
    expect(resolveJwtSecret('  secreto-configurado  ')).toBe('secreto-configurado');
  });

  it('sin argumento toma JWT_SECRET del entorno', () => {
    process.env.JWT_SECRET = 'secreto-del-entorno';
    expect(resolveJwtSecret()).toBe('secreto-del-entorno');
  });

  it('fuera de producción genera un secreto aleatorio largo y estable dentro del proceso', () => {
    process.env.NODE_ENV = 'development';
    const first = resolveJwtSecret('');
    expect(first.length).toBeGreaterThanOrEqual(32);
    expect(resolveJwtSecret('   ')).toBe(first);
    expect(resolveJwtSecret()).toBe(first);
    expect(first).not.toBe('development-secret');
  });

  it('en producción exige JWT_SECRET', () => {
    process.env.NODE_ENV = 'production';
    expect(() => resolveJwtSecret('')).toThrow('JWT_SECRET is required in production');
  });
});

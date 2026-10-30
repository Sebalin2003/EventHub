import { describe, it, expect } from 'vitest';
import { ScryptHashStrategy } from './strategies/scrypt-hash.strategy.js';

describe('ScryptHashStrategy (Eje D: Criptografía y Hash de Contraseñas)', () => {
  const strategy = new ScryptHashStrategy();

  it('debe generar un hash con formato salt:hash aleatorio para cada invocación', () => {
    const password = 'SecretPassword123!';
    const hash1 = strategy.hashPassword(password);
    const hash2 = strategy.hashPassword(password);

    expect(hash1).toContain(':');
    expect(hash2).toContain(':');
    // Salting garantiza que hashes de la misma contraseña sean distintos
    expect(hash1).not.toBe(hash2);
  });

  it('debe validar correctamente la contraseña correcta', () => {
    const password = 'MySecurePassword';
    const hash = strategy.hashPassword(password);

    expect(strategy.validPassword(password, hash)).toBe(true);
  });

  it('debe rechazar una contraseña incorrecta', () => {
    const password = 'MySecurePassword';
    const hash = strategy.hashPassword(password);

    expect(strategy.validPassword('WrongPassword', hash)).toBe(false);
  });

  it('debe manejar hashes corruptos o inválidos de forma segura sin excepciones', () => {
    expect(strategy.validPassword('password', 'corrupted-hash-without-salt')).toBe(false);
    expect(strategy.validPassword('password', '')).toBe(false);
  });
});

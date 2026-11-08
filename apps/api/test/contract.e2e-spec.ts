import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { openApiDocument } from '../src/openapi.js';
import { contractErrors, validateContract } from './support/openapi-validator.js';

const doc = openApiDocument as unknown as {
  openapi: string;
  info: { title: string; version: string };
  paths: Record<string, Record<string, any>>;
  components: { schemas: Record<string, any> };
};

const publishedPath = fileURLToPath(
  new URL('../../../docs/contracts/openapi.json', import.meta.url),
);

describe('Eje B - Contrato OpenAPI publicado', () => {
  it('declara OpenAPI 3.1 y metadata del servicio', () => {
    expect(doc.openapi).toBe('3.1.0');
    expect(doc.info.title).toBe('EventHub API');
    expect(doc.info.version).toBe('1.0.0');
  });

  it('documenta todos los endpoints de negocio con respuesta de exito y de error', () => {
    const businessPaths = Object.entries(doc.paths).filter(([path]) => path !== '/' && path !== '/openapi.json');
    expect(businessPaths.length).toBeGreaterThanOrEqual(20);

    for (const [path, operations] of businessPaths) {
      for (const [method, operation] of Object.entries(operations)) {
        if (method.startsWith('x-')) continue;
        const responses = Object.keys(operation.responses ?? {});
        expect(responses.some(code => code.startsWith('2')), `${method.toUpperCase()} ${path} sin 2xx`).toBe(true);
        expect(responses.some(code => Number(code) >= 400), `${method.toUpperCase()} ${path} sin respuesta de error`).toBe(true);
      }
    }
  });

  it('resuelve todas las referencias internas del contrato', () => {
    const refs: string[] = [];
    const walk = (node: any): void => {
      if (!node || typeof node !== 'object') return;
      if (typeof node.$ref === 'string' && node.$ref.startsWith('#/')) refs.push(node.$ref);
      for (const value of Object.values(node)) walk(value);
    };
    walk(doc);

    const resolvePointer = (pointer: string): unknown => {
      return pointer
        .replace(/^#\//, '')
        .split('/')
        .reduce<any>((current, segment) => current?.[segment.replace(/~1/g, '/').replace(/~0/g, '~')], doc);
    };

    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) {
      expect(resolvePointer(ref), `referencia rota ${ref}`).toBeDefined();
    }
  });

  it('valida respuestas reales de ejemplo con Ajv', () => {
    validateContract('AuthResponse', {
      accessToken: 'header.payload.signature',
      user: {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'maria@eventhub.com.ar',
        firstName: 'Maria',
        lastName: 'Gonzalez',
        role: 'attendee',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });

    validateContract('Order', {
      id: '00000000-0000-0000-0000-000000000002',
      userId: '00000000-0000-0000-0000-000000000001',
      status: 'pending',
      total: 85000,
      version: 1,
      items: [
        {
          eventId: '00000000-0000-0000-0000-000000000003',
          ticketTypeId: 'tt1a',
          ticketType: 'General',
          quantity: 1,
          unitPrice: 85000,
          subtotal: 85000,
        },
      ],
      holds: [],
    });

    validateContract('ProblemDetails', {
      type: 'https://eventhub.com/errors/conflict',
      title: 'Conflict',
      status: 409,
      detail: 'Transicion invalida',
      instance: '/orders/1/refund',
      timestamp: '2026-01-01T00:00:00.000Z',
    });

    validateContract('ScanResult', {
      success: true,
      result: 'ENTRADA_VALIDA',
      ticketId: '00000000-0000-0000-0000-000000000004',
      code: 'EVT-AAAAAAAAAAAAAAAA',
      eventId: '00000000-0000-0000-0000-000000000003',
      scannedAt: '2026-01-01T00:00:00.000Z',
      message: 'Entrada valida',
    });

    expect(contractErrors('PaymentResult', { success: true, code: 'APPROVED', reason: 'ok' })).toBeNull();
  });

  it('mantiene sincronizado el contrato exportado en docs/contracts/openapi.json', () => {
    expect(existsSync(publishedPath), `falta ${publishedPath}; corre pnpm --filter api openapi:export`).toBe(true);
    const published = JSON.parse(readFileSync(publishedPath, 'utf8'));
    expect(published).toEqual(JSON.parse(JSON.stringify(doc)));
  });
});

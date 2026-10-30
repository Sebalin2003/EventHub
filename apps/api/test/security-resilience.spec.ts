import { describe, it, expect, beforeEach } from 'vitest';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../src/common/guards/roles.guard.js';
import { RateLimiterGuard } from '../src/common/guards/rate-limiter.guard.js';
import { ProblemDetailsFilter } from '../src/common/filters/problem-details.filter.js';
import { UnauthorizedException, ForbiddenException, PreconditionFailedException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../src/modules/identity/entities/user.entity.js';

describe('Security & Resilience Suite (Ejes C y D: OWASP ASVS, RFC 9457, BOLA, BFLA)', () => {
  describe('Eje D: Validación de JWT y Algoritmo "none" (OWASP)', () => {
    let jwtServiceMock: any;
    let guard: JwtAuthGuard;

    beforeEach(() => {
      jwtServiceMock = {
        verify: (token: string) => {
          if (token.includes('expired-token')) throw new Error('jwt expired');
          if (token.includes('tampered-token')) throw new Error('invalid signature');
          return { sub: 'usr-1', email: 'user@test.com', role: 'attendee' };
        },
      };
      guard = new JwtAuthGuard(jwtServiceMock);
    });

    it('debe rechazar tokens con alg=none con 401 Unauthorized', () => {
      // Header: {"alg":"none","typ":"JWT"} -> eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0
      const noneToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIn0.';
      const contextMock: any = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { authorization: `Bearer ${noneToken}` },
          }),
        }),
      };

      expect(() => guard.canActivate(contextMock)).toThrow(UnauthorizedException);
    });

    it('debe rechazar tokens expirados con 401 Unauthorized', () => {
      // Header: {"alg":"HS256","typ":"JWT"} -> eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired-token.fake-sig';
      const contextMock: any = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { authorization: `Bearer ${expiredToken}` },
          }),
        }),
      };

      expect(() => guard.canActivate(contextMock)).toThrow(UnauthorizedException);
    });

    it('debe rechazar tokens con firma alterada con 401 Unauthorized', () => {
      const tamperedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered-token.fake-sig';
      const contextMock: any = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { authorization: `Bearer ${tamperedToken}` },
          }),
        }),
      };

      expect(() => guard.canActivate(contextMock)).toThrow(UnauthorizedException);
    });

    it('debe rechazar peticiones sin header Authorization con 401 Unauthorized', () => {
      const contextMock: any = {
        switchToHttp: () => ({
          getRequest: () => ({ headers: {} }),
        }),
      };

      expect(() => guard.canActivate(contextMock)).toThrow(UnauthorizedException);
    });

    it('debe aceptar tokens válidos y poblar request.user con sub e id', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid-payload.valid-sig';
      const req: any = { headers: { authorization: `Bearer ${validToken}` } };
      const contextMock: any = {
        switchToHttp: () => ({
          getRequest: () => req,
        }),
      };

      const result = guard.canActivate(contextMock);
      expect(result).toBe(true);
      expect(req.user.id).toBe('usr-1');
      expect(req.user.sub).toBe('usr-1');
    });
  });

  describe('Eje D: BFLA (Broken Function Level Authorization)', () => {
    let reflector: Reflector;
    let rolesGuard: RolesGuard;

    beforeEach(() => {
      reflector = new Reflector();
      rolesGuard = new RolesGuard(reflector);
    });

    it('debe rechazar con 403 Forbidden si un usuario con rol ATTENDEE intenta invocar un endpoint ADMIN', () => {
      const contextMock: any = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({
            user: { role: UserRole.ATTENDEE },
          }),
        }),
      };

      // Mock reflector devolviendo que el endpoint requiere ADMIN
      reflector.getAllAndOverride = () => [UserRole.ADMIN];

      expect(() => rolesGuard.canActivate(contextMock)).toThrow(ForbiddenException);
    });

    it('debe permitir la ejecución si el rol coincide con los requeridos', () => {
      const contextMock: any = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({
            user: { role: UserRole.ADMIN },
          }),
        }),
      };

      reflector.getAllAndOverride = () => [UserRole.ADMIN, UserRole.ORGANIZER];

      expect(rolesGuard.canActivate(contextMock)).toBe(true);
    });
  });

  describe('Eje D: Protección contra Fuerza Bruta / Rate Limiting (429)', () => {
    it('debe bloquear con 429 Too Many Requests tras superar el umbral de intentos', () => {
      const limiter = new RateLimiterGuard();
      const req: any = {
        ip: '192.168.1.100',
        body: { email: 'target@eventhub.com' },
      };
      const contextMock: any = {
        switchToHttp: () => ({ getRequest: () => req }),
      };

      // Primeros 5 intentos permitidos
      for (let i = 0; i < 5; i++) {
        expect(limiter.canActivate(contextMock)).toBe(true);
      }

      // 6to intento: debe lanzar excepción con HTTP 429
      try {
        limiter.canActivate(contextMock);
        expect.unreachable();
      } catch (err: any) {
        expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        expect(err.message).toContain('Límite de intentos excedido');
      }
    });
  });

  describe('Eje C: RFC 9457 Problem Details Exception Filter', () => {
    it('debe formatear los errores bajo la especificación RFC 9457 sin fugar stack traces', () => {
      const filter = new ProblemDetailsFilter();
      let capturedStatus = 0;
      let capturedBody: any = null;
      let capturedContentType = '';

      const hostMock: any = {
        switchToHttp: () => ({
          getRequest: () => ({
            originalUrl: '/api/orders/xyz',
            url: '/api/orders/xyz',
          }),
          getResponse: () => ({
            setHeader: (header: string, value: string) => {
              if (header.toLowerCase() === 'content-type') capturedContentType = value;
            },
            status: (s: number) => {
              capturedStatus = s;
              return {
                json: (b: any) => { capturedBody = b; },
              };
            },
          }),
        }),
      };

      const exception = new PreconditionFailedException('ETag desactualizado');
      filter.catch(exception, hostMock);

      expect(capturedStatus).toBe(412);
      expect(capturedContentType).toBe('application/problem+json');
      expect(capturedBody).toMatchObject({
        type: 'https://eventhub.com/errors/precondition-failed',
        title: 'Precondition Failed',
        status: 412,
        detail: 'ETag desactualizado',
        instance: '/api/orders/xyz',
      });
      expect(capturedBody.stack).toBeUndefined(); // Verifica que no se filtre stack trace
    });
  });
});

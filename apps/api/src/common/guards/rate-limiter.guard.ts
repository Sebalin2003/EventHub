import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

interface AttemptRecord {
  count: number;
  firstAttempt: number;
}

@Injectable()
export class RateLimiterGuard implements CanActivate {
  private readonly attempts = new Map<string, AttemptRecord>();
  private readonly maxAttempts = 5;
  private readonly windowMs = 60 * 1000; // 1 minute

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = request.ip || request.socket.remoteAddress || 'unknown';
    const email = (request.body && typeof request.body.email === 'string') ? request.body.email.toLowerCase().trim() : '';
    const key = `${ip}:${email}`;

    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record) {
      this.attempts.set(key, { count: 1, firstAttempt: now });
      return true;
    }

    if (now - record.firstAttempt > this.windowMs) {
      // Window expired, reset
      this.attempts.set(key, { count: 1, firstAttempt: now });
      return true;
    }

    if (record.count >= this.maxAttempts) {
      const remainingSec = Math.ceil((this.windowMs - (now - record.firstAttempt)) / 1000);
      throw new HttpException(
        `Límite de intentos excedido por seguridad contra fuerza bruta. Por favor reintente en ${remainingSec} segundos.`,
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    record.count++;
    return true;
  }

  // Method to clear attempts for testing
  reset() {
    this.attempts.clear();
  }
}

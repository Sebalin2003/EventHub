import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface AuthenticatedUser {
  id: string;
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: { authorization?: string }; user?: AuthenticatedUser }>();
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Bearer token required');
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      throw new UnauthorizedException('Bearer token required');
    }

    // OWASP Security Check: Reject alg=none or malformed tokens
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new UnauthorizedException('Malformed token structure');
      }

      const headerJson = Buffer.from(parts[0], 'base64').toString('utf8');
      const header = JSON.parse(headerJson);
      if (!header.alg || header.alg.toLowerCase() === 'none') {
        throw new UnauthorizedException('Algorithm "none" is strictly forbidden');
      }
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      throw new UnauthorizedException('Invalid token header');
    }

    try {
      const payload = this.jwt.verify(token);
      request.user = {
        id: payload.sub || payload.id,
        sub: payload.sub || payload.id,
        email: payload.email,
        role: payload.role,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

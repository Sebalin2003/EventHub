import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import type { UserRole } from '../../modules/identity/entities/user.entity.js';

type AuthenticatedRequest = {
  user?: { role?: UserRole };
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user?.role || !roles.includes(request.user.role)) {
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }
}

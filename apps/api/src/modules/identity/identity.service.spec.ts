import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IdentityService } from './identity.service.js';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { User, UserRole } from './entities/user.entity.js';

describe('IdentityService', () => {
  let service: IdentityService;
  let userDao: any;
  let jwt: any;
  let hashStrategy: any;

  beforeEach(() => {
    userDao = {
      existsByEmail: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn(),
    };
    jwt = {
      signAsync: vi.fn().mockResolvedValue('jwt-mock-token'),
    };
    hashStrategy = {
      hashPassword: vi.fn().mockReturnValue('salt:hash123'),
      validPassword: vi.fn(),
    };

    service = new IdentityService(userDao, jwt, hashStrategy);
  });

  describe('register', () => {
    it('debe registrar exitosamente un usuario nuevo con email normalizado', async () => {
      userDao.existsByEmail.mockResolvedValue(false);
      userDao.save.mockImplementation((data: any) =>
        Promise.resolve({ id: 'u1', role: UserRole.ATTENDEE, ...data }),
      );

      const result = await service.register({
        email: '  TestUser@EventHub.com  ',
        password: 'password123',
        firstName: 'Juan',
        lastName: 'Pérez',
      });

      expect(userDao.existsByEmail).toHaveBeenCalledWith('testuser@eventhub.com');
      expect(hashStrategy.hashPassword).toHaveBeenCalledWith('password123');
      expect(result.email).toBe('testuser@eventhub.com');
      expect((result as any).passwordHash).toBeUndefined(); // Verifica que no se filtre el hash
    });

    it('debe rechazar registro con 409 Conflict si el email ya existe', async () => {
      userDao.existsByEmail.mockResolvedValue(true);

      await expect(
        service.register({
          email: 'existing@eventhub.com',
          password: 'password123',
          firstName: 'Juan',
          lastName: 'Pérez',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('debe loguear exitosamente con credenciales válidas y devolver accessToken', async () => {
      const mockUser = new User();
      mockUser.id = 'u1';
      mockUser.email = 'test@eventhub.com';
      mockUser.passwordHash = 'salt:hash123';
      mockUser.role = UserRole.ATTENDEE;

      userDao.findByEmail.mockResolvedValue(mockUser);
      hashStrategy.validPassword.mockReturnValue(true);

      const result = await service.login('test@eventhub.com', 'password123');

      expect(result.accessToken).toBe('jwt-mock-token');
      expect(result.user.email).toBe('test@eventhub.com');
      expect((result.user as any).passwordHash).toBeUndefined();
    });

    it('debe rechazar con 401 Unauthorized si el email no existe', async () => {
      userDao.findByEmail.mockResolvedValue(null);

      await expect(service.login('notfound@eventhub.com', 'pass')).rejects.toThrow(UnauthorizedException);
    });

    it('debe rechazar con 401 Unauthorized si la contraseña es errónea', async () => {
      const mockUser = new User();
      mockUser.email = 'test@eventhub.com';
      mockUser.passwordHash = 'salt:hash123';

      userDao.findByEmail.mockResolvedValue(mockUser);
      hashStrategy.validPassword.mockReturnValue(false);

      await expect(service.login('test@eventhub.com', 'wrongpassword')).rejects.toThrow(UnauthorizedException);
    });
  });
});

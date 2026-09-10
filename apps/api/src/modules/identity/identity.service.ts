import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/user.entity.js';
import { UserDao } from './user.dao.js';
import { HASH_STRATEGY } from './strategies/hash.strategy.js';
import type { HashStrategy } from './strategies/hash.strategy.js';

type RegisterData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

@Injectable()
export class IdentityService {
  constructor(
    private readonly userDao: UserDao,
    private readonly jwt: JwtService,
    @Inject(HASH_STRATEGY) private readonly hashStrategy: HashStrategy,
  ) {}

  async register(data: RegisterData) {
    const email = data.email.trim().toLowerCase();
    if (await this.userDao.existsByEmail(email)) {
      throw new ConflictException('Email already registered');
    }

    const user = await this.userDao.save({
      email,
      passwordHash: this.hashStrategy.hashPassword(data.password),
      firstName: data.firstName,
      lastName: data.lastName,
    });

    return this.publicUser(user);
  }

  async login(email: string, password: string) {
    const user = await this.userDao.findByEmail(email.trim().toLowerCase());
    if (!user || !this.hashStrategy.validPassword(password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      accessToken: await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role }),
      user: this.publicUser(user),
    };
  }

  private publicUser(user: User) {
    const { passwordHash: _passwordHash, ...publicUser } = user;
    return publicUser;
  }
}

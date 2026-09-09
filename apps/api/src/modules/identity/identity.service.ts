import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
import { HASH_STRATEGY, HashStrategy } from './strategies/hash.strategy.js';

type RegisterData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

@Injectable()
export class IdentityService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
    @Inject(HASH_STRATEGY) private readonly hashStrategy: HashStrategy,
  ) {}

  async register(data: RegisterData) {
    const email = data.email.trim().toLowerCase();
    if (await this.users.exists({ where: { email } })) {
      throw new ConflictException('Email already registered');
    }

    const user = await this.users.save({
      email,
      passwordHash: this.hashStrategy.hashPassword(data.password),
      firstName: data.firstName,
      lastName: data.lastName,
    });

    return this.publicUser(user);
  }

  async login(email: string, password: string) {
    const user = await this.users.findOne({ where: { email: email.trim().toLowerCase() } });
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

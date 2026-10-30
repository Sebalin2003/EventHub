import { Body, Controller, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { IdentityService } from './identity.service.js';
import { RegisterDto, LoginDto } from './dto/auth.dto.js';
import { RateLimiterGuard } from '../../common/guards/rate-limiter.guard.js';

@Controller('auth')
export class IdentityController {
  constructor(private readonly identity: IdentityService) {}

  @Post('register')
  register(@Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) body: RegisterDto) {
    return this.identity.register(body);
  }

  @Post('login')
  @UseGuards(RateLimiterGuard)
  login(@Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) body: LoginDto) {
    return this.identity.login(body.email, body.password);
  }
}

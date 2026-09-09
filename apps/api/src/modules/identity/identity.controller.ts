import { Body, Controller, Post } from '@nestjs/common';
import { IdentityService } from './identity.service.js';

type RegisterBody = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

type LoginBody = {
  email: string;
  password: string;
};

@Controller('auth')
export class IdentityController {
  constructor(private readonly identity: IdentityService) {}

  @Post('register')
  register(@Body() body: RegisterBody) {
    return this.identity.register(body);
  }

  @Post('login')
  login(@Body() body: LoginBody) {
    return this.identity.login(body.email, body.password);
  }
}

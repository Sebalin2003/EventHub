import { Controller, Get, Header } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  getHello(): { service: string; status: string } {
    return this.appService.getHello();
  }
}

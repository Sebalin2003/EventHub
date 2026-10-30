import { Controller, Post, Body } from '@nestjs/common';
import { AiAdvisorService, AiAdvisorRequest } from './ai.service.js';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiAdvisorService) {}

  @Post('advisor')
  getAdvice(@Body() body: AiAdvisorRequest) {
    return this.aiService.getAdvice(body);
  }
}

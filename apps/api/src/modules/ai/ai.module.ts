import { Module } from '@nestjs/common';
import { AiController } from './ai.controller.js';
import { AiAdvisorService } from './ai.service.js';

@Module({
  controllers: [AiController],
  providers: [AiAdvisorService],
  exports: [AiAdvisorService],
})
export class AiModule {}

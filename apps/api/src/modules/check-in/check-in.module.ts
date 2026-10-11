import { Module } from '@nestjs/common';
import { CheckInController } from './check-in.controller.js';

@Module({
  controllers: [CheckInController],
})
export class CheckInModule { }

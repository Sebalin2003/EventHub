import { Module } from '@nestjs/common';
import { CheckInController } from './check-in.controller';

@Module({
  controllers: [CheckInController],
})
export class CheckInModule { }

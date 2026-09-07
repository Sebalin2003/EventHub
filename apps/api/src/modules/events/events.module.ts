import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/event.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Event])],
  exports: [TypeOrmModule]
})
export class EventsModule {}

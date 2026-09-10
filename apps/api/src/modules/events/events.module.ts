import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../identity/entities/user.entity.js';
import { Event } from './entities/event.entity.js';
import { EventDao } from './event.dao.js';
import { EventFactory } from './event.factory.js';
import { EventsController } from './events.controller.js';
import { EventsService } from './events.service.js';
import { EventSeed } from './event.seed.js';

@Module({
  imports: [TypeOrmModule.forFeature([Event, User])],
  controllers: [EventsController],
  providers: [EventsService, EventDao, EventFactory, EventSeed],
  exports: [EventsService, EventDao],
})
export class EventsModule {}

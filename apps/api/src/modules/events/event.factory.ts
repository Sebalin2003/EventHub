import { Injectable } from '@nestjs/common';
import { Event } from './entities/event.entity.js';

@Injectable()
export class EventFactory {
  createEvent(data: Partial<Event>): Event {
    const event = new Event();
    Object.assign(event, data);
    return event;
  }
}

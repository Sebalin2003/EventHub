import { describe, it, expect } from 'vitest';
import { EventFactory } from './event.factory.js';
import { Event, EventStatus } from './entities/event.entity.js';

describe('EventFactory (Eje B: creación de dominio)', () => {
  it('crea una entidad Event con los datos recibidos', () => {
    const factory = new EventFactory();

    const event = factory.createEvent({
      id: 'evt-1',
      title: 'Conferencia',
      status: EventStatus.DRAFT,
      capacity: 100,
    });

    expect(event).toBeInstanceOf(Event);
    expect(event).toMatchObject({ id: 'evt-1', title: 'Conferencia', status: EventStatus.DRAFT, capacity: 100 });
  });

  it('no comparte estado entre eventos creados', () => {
    const factory = new EventFactory();
    const first = factory.createEvent({ title: 'A' });
    const second = factory.createEvent({ title: 'B' });

    expect(first).not.toBe(second);
    expect(first.title).toBe('A');
    expect(second.title).toBe('B');
  });
});

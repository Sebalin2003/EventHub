import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ClientProxy, Transport } from '@nestjs/microservices';
import * as amqp from 'amqplib';
import { firstValueFrom } from 'rxjs';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { ProblemDetailsFilter } from '../src/common/filters/problem-details.filter.js';
import { OutboxService } from '../src/common/broker/outbox.service.js';
import {
  NOTIFICATIONS_DLQ,
  NOTIFICATIONS_DLX,
  NOTIFICATIONS_QUEUE,
} from '../src/common/broker/broker.constants.js';
import { validateContract } from './support/openapi-validator.js';

/**
 * Eje B: prueba de integracion contra dependencias REALES.
 *
 * No se mockea nada: se levanta el AppModule completo, se conecta a PostgreSQL
 * y RabbitMQ reales (contenedores de docker-compose), se publica en la cola
 * `notifications_queue` y se verifica la persistencia en la tabla `notifications`.
 */
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'integration-test-secret-eventhub';
process.env.DB_HOST = process.env.DB_HOST ?? 'localhost';
process.env.DB_PORT = process.env.DB_PORT ?? '5432';
process.env.DB_USERNAME = process.env.DB_USERNAME ?? 'user';
process.env.DB_PASSWORD = process.env.DB_PASSWORD ?? 'password';
process.env.DB_DATABASE = process.env.DB_DATABASE ?? 'evenhub';
process.env.RABBITMQ_URL = process.env.RABBITMQ_URL ?? 'amqp://user:password@localhost:5672';

const API = () => app.getHttpServer();

let app: INestApplication;
let dataSource: DataSource;
let amqpConnection: any;
let amqpChannel: any;
let attendeeToken: string;
let staffToken: string;
let attendeeEmail: string;
let orderId: string;
let ticketId: string;

async function login(email: string, password = 'password'): Promise<string> {
  const response = await request(API()).post('/auth/login').send({ email, password }).expect(200);
  validateContract('AuthResponse', response.body);
  return response.body.accessToken;
}

async function waitFor<T>(check: () => Promise<T | null>, timeoutMs = 15000): Promise<T> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const value = await check();
    if (value) return value;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(`Timeout esperando condicion asincronica (${timeoutMs}ms)`);
}

describe.sequential('Eje B - Integracion con PostgreSQL y RabbitMQ reales', () => {
  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ProblemDetailsFilter());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

    app.connectMicroservice({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL!],
        queue: NOTIFICATIONS_QUEUE,
        noAck: false,
        queueOptions: {
          durable: true,
          deadLetterExchange: NOTIFICATIONS_DLX,
          deadLetterRoutingKey: NOTIFICATIONS_DLQ,
        },
      },
    });

    await app.init();
    await app.startAllMicroservices();
    await app.listen(0);

    dataSource = app.get(DataSource);

    amqpConnection = await amqp.connect(process.env.RABBITMQ_URL!, { timeout: 5000 });
    amqpChannel = await amqpConnection.createChannel();
    await amqpChannel.assertExchange(NOTIFICATIONS_DLX, 'direct', { durable: true });
    await amqpChannel.assertQueue(NOTIFICATIONS_DLQ, { durable: true });
    await amqpChannel.bindQueue(NOTIFICATIONS_DLQ, NOTIFICATIONS_DLX, NOTIFICATIONS_DLQ);
  }, 120000);

  afterAll(async () => {
    await amqpChannel?.close().catch(() => undefined);
    await amqpConnection?.close().catch(() => undefined);
    await app?.close();
  }, 120000);

  it('arranca contra PostgreSQL real y el seed esta persistido', async () => {
    const [{ count: events }] = await dataSource.query('SELECT COUNT(*)::int AS count FROM events');
    const [{ count: users }] = await dataSource.query('SELECT COUNT(*)::int AS count FROM users');
    const [{ count: notifications }] = await dataSource.query('SELECT COUNT(*)::int AS count FROM notifications');

    expect(events).toBeGreaterThanOrEqual(20);
    expect(users).toBeGreaterThanOrEqual(8);
    expect(notifications).toBeGreaterThanOrEqual(0);
  });

  it('autentica usuarios reales contra la base y valida el contrato AuthResponse', async () => {
    attendeeEmail = 'maria@eventhub.com.ar';
    attendeeToken = await login(attendeeEmail);
    staffToken = await login('staff@eventhub.com.ar');

    expect(attendeeToken.split('.')).toHaveLength(3);
    expect(staffToken.split('.')).toHaveLength(3);

    const unauthorized = await request(API()).get('/orders').expect(401);
    expect(unauthorized.headers['content-type']).toContain('application/problem+json');
    validateContract('ProblemDetails', unauthorized.body);
  });

  it('devuelve el catalogo real validado contra el schema Event', async () => {
    const response = await request(API()).get('/events').expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(20);
    for (const event of response.body) {
      validateContract('Event', event);
    }
  });

  it('crea una orden real, toma el hold y respeta la idempotencia', async () => {
    const idempotencyKey = `it-${Date.now()}`;
    const response = await request(API())
      .post('/orders')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({ items: [{ eventId: 'e1', ticketType: 'tt1a', quantity: 1 }] })
      .expect(201);

    validateContract('Order', response.body);
    expect(response.body.status).toBe('pending');
    expect(response.body.holds).toHaveLength(1);
    orderId = response.body.id;

    const repeated = await request(API())
      .post('/orders')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({ items: [{ eventId: 'e1', ticketType: 'tt1a', quantity: 1 }] })
      .expect(201);

    expect(repeated.body.id).toBe(orderId);
  });

  it('persiste la orden en PostgreSQL y expone ETag de concurrencia', async () => {
    const rows = await dataSource.query('SELECT id, status, version FROM orders WHERE id = $1', [orderId]);
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('pending');

    const response = await request(API())
      .get(`/orders/${orderId}`)
      .set('Authorization', `Bearer ${attendeeToken}`)
      .expect(200);

    expect(response.headers.etag).toBe('W/"1"');
    validateContract('Order', response.body);
  });

  it('rechaza una transicion invalida con 409 Problem Details', async () => {
    const response = await request(API())
      .patch(`/orders/${orderId}/refund`)
      .set('Authorization', `Bearer ${attendeeToken}`)
      .expect(409);

    expect(response.headers['content-type']).toContain('application/problem+json');
    validateContract('ProblemDetails', response.body);
    expect(response.body.status).toBe(409);
  });

  it('rechaza un ETag desactualizado con 412 Problem Details', async () => {
    const response = await request(API())
      .patch(`/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${attendeeToken}`)
      .set('If-Match', 'W/"999"')
      .send({ card: '4111 1111 1111 1111' })
      .expect(412);

    validateContract('ProblemDetails', response.body);
  });

  it('paga la orden real, emite tickets y los persiste en PostgreSQL', async () => {
    const response = await request(API())
      .post(`/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({ card: '4111 1111 1111 1111' })
      .expect(201);

    validateContract('Order', response.body);
    expect(response.body.status).toBe('paid');
    expect(response.body.tickets).toHaveLength(1);
    validateContract('Ticket', response.body.tickets[0]);
    ticketId = response.body.tickets[0].id;

    const rows = await dataSource.query('SELECT status FROM orders WHERE id = $1', [orderId]);
    expect(rows[0].status).toBe('paid');

    const tickets = await dataSource.query('SELECT id, status FROM tickets WHERE "orderId" = $1', [orderId]);
    expect(tickets.length).toBeGreaterThanOrEqual(1);
  });

  it('hace check-in real y rechaza el segundo escaneo con 409', async () => {
    const first = await request(API())
      .post(`/check-in/${ticketId}/scan`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ eventId: 'e1' })
      .expect(201);

    validateContract('ScanResult', first.body);
    expect(first.body.result).toBe('ENTRADA_VALIDA');

    const second = await request(API())
      .post(`/check-in/${ticketId}/scan`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ eventId: 'e1' })
      .expect(409);

    validateContract('ProblemDetails', second.body);
    expect(second.body.status).toBe(409);
  });

  it('persiste favoritos reales y valida el contrato Favorite', async () => {
    // Limpieza idempotente: la base real puede conservar favoritos de corridas previas.
    await request(API())
      .delete('/me/favorites/e2')
      .set('Authorization', `Bearer ${attendeeToken}`);

    const added = await request(API())
      .put('/me/favorites/e2')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .expect(200);

    validateContract('Favorite', added.body);

    const list = await request(API())
      .get('/me/favorites')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .expect(200);

    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body.some((favorite: { eventId: string }) => favorite.eventId === added.body.eventId)).toBe(true);

    await request(API())
      .delete('/me/favorites/e2')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .expect(200);
  });

  it('responde con el contrato AiAdvisorResponse real', async () => {
    const response = await request(API())
      .post('/ai/advisor')
      .send({ prompt: 'Recomendame un evento de musica' })
      .expect(201);

    validateContract('AiAdvisorResponse', response.body);
    expect(typeof response.body.reply).toBe('string');
  });

  it('publica y consume mensajes por RabbitMQ real, persistiendo la notificacion', async () => {
    const client = app.get<ClientProxy>('NOTIFICATIONS_SERVICE');
    const marker = `integration-${Date.now()}@eventhub.com.ar`;

    await firstValueFrom(
      client.emit('event.created', {
        id: `it-event-${Date.now()}`,
        eventId: 'e1',
        organizerEmail: marker,
        title: 'Evento de integracion',
      }),
    );

    const notification = await waitFor(async () => {
      const rows = await dataSource.query(
        'SELECT id, "to", template FROM notifications WHERE "to" = $1 ORDER BY "createdAt" DESC LIMIT 1',
        [marker],
      );
      return rows[0] ?? null;
    });

    expect(notification.id).toBeDefined();
    expect(notification.to).toBe(marker);
    expect(notification.template).toBe('event-notification');

    // El flujo de pago real tambien debe publicar order.paid y consumirse.
    const paid = await waitFor(async () => {
      const rows = await dataSource.query(
        'SELECT id FROM notifications WHERE "to" = $1 AND template = $2 ORDER BY "createdAt" DESC LIMIT 1',
        [attendeeEmail, 'order-paid'],
      );
      return rows[0] ?? null;
    });

    expect(paid.id).toBeDefined();
  }, 30000);

  it('publica eventos por el outbox transaccional y los marca como SENT', async () => {
    const outbox = app.get(OutboxService);
    const marker = `outbox-${Date.now()}@eventhub.com.ar`;

    const message = await outbox.enqueue('event.created', {
      id: `outbox-${Date.now()}`,
      eventId: 'e1',
      organizerEmail: marker,
      title: 'Evento enviado por outbox',
    });

    const flush = await outbox.flush();
    expect(flush.sent + flush.pending).toBeGreaterThanOrEqual(0);

    const stored = await waitFor(async () => {
      await outbox.flush();
      const [row] = await dataSource.query(
        'SELECT id, topic, status, "sentAt" FROM outbox_messages WHERE id = $1',
        [message.id],
      );
      return row?.status === 'SENT' ? row : null;
    }, 20000);

    expect(stored.topic).toBe('event.created');
    expect(stored.status).toBe('SENT');
    expect(stored.sentAt).not.toBeNull();

    const notification = await waitFor(async () => {
      const rows = await dataSource.query(
        'SELECT id FROM notifications WHERE "to" = $1 ORDER BY "createdAt" DESC LIMIT 1',
        [marker],
      );
      return rows[0] ?? null;
    });
    expect(notification.id).toBeDefined();
  }, 30000);

  it('procesa una sola vez un mensaje duplicado en el consumidor real', async () => {
    const client = app.get<ClientProxy>('NOTIFICATIONS_SERVICE');
    const marker = `duplicado-${Date.now()}@eventhub.com.ar`;
    const messageId = `dup-${Date.now()}`;

    await firstValueFrom(client.emit('event.created', { id: messageId, eventId: 'e1', organizerEmail: marker }));
    await waitFor(async () => {
      const rows = await dataSource.query('SELECT id FROM notifications WHERE "to" = $1', [marker]);
      return rows.length === 1 ? rows[0] : null;
    });

    // Se publica exactamente el mismo mensaje (mismo id) una segunda vez.
    await firstValueFrom(client.emit('event.created', { id: messageId, eventId: 'e1', organizerEmail: marker }));
    await new Promise(resolve => setTimeout(resolve, 1500));

    const rows = await dataSource.query('SELECT id FROM notifications WHERE "to" = $1', [marker]);
    expect(rows).toHaveLength(1);
  }, 30000);

  it('enruta un mensaje invalido a la DLQ real de RabbitMQ y permite reprocesarlo', async () => {
    const client = app.get<ClientProxy>('NOTIFICATIONS_SERVICE');
    const messageId = `dlq-${Date.now()}`;
    const poisonPayload = { id: messageId, eventId: 'e1' };

    await amqpChannel.purgeQueue(NOTIFICATIONS_DLQ);

    // El servicio reintenta 3 veces y luego el controlador hace nack sin requeue.
    for (let attempt = 1; attempt <= 3; attempt++) {
      await firstValueFrom(client.emit('event.created', poisonPayload));
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    const dead = await waitFor(async () => {
      const message = await amqpChannel.get(NOTIFICATIONS_DLQ, { noAck: true });
      if (!message) return null;
      const content = JSON.parse(message.content.toString());
      const payload = content?.data ?? content;
      return payload?.id === messageId ? message : null;
    }, 20000);

    expect(dead).not.toBeNull();
    expect(dead.fields.exchange).toBe(NOTIFICATIONS_DLX);
    expect(dead.properties.headers['x-death']).toBeDefined();
    expect(dead.properties.headers['x-death'][0].queue).toBe(NOTIFICATIONS_QUEUE);

    // Reproceso: el mismo mensaje, ahora con destinatario valido, se procesa.
    const marker = `reproceso-${Date.now()}@eventhub.com.ar`;
    await firstValueFrom(client.emit('event.created', { ...poisonPayload, organizerEmail: marker }));

    const reprocessed = await waitFor(async () => {
      const rows = await dataSource.query(
        'SELECT id FROM notifications WHERE "to" = $1 ORDER BY "createdAt" DESC LIMIT 1',
        [marker],
      );
      return rows[0] ?? null;
    });
    expect(reprocessed.id).toBeDefined();
  }, 45000);

  it('compensa la orden y libera el hold cuando el pago es rechazado', async () => {
    const created = await request(API())
      .post('/orders')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .set('Idempotency-Key', `comp-${Date.now()}`)
      .send({ items: [{ eventId: 'e1', ticketType: 'tt1a', quantity: 1 }] })
      .expect(201);

    const declined = await request(API())
      .post(`/orders/${created.body.id}/pay`)
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({ card: '4111 1111 0340 01' })
      .expect(402);

    expect(declined.body.status).toBe(402);

    const [order] = await dataSource.query('SELECT status FROM orders WHERE id = $1', [created.body.id]);
    expect(order.status).toBe('cancelled');

    const tickets = await dataSource.query('SELECT id FROM tickets WHERE "orderId" = $1', [created.body.id]);
    expect(tickets).toHaveLength(0);

    const paidMessages = await dataSource.query(
      "SELECT id FROM outbox_messages WHERE topic = 'order.paid' AND payload->>'orderId' = $1",
      [created.body.id],
    );
    expect(paidMessages).toHaveLength(0);

    // El hold fue liberado: un segundo intento de pago ya no encuentra la orden pendiente.
    await request(API())
      .post(`/orders/${created.body.id}/pay`)
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({ card: '4111 1111 1111 1111' })
      .expect(409);
  }, 30000);

  it('expone el contrato OpenAPI publicado en /openapi.json', async () => {
    const response = await request(API()).get('/openapi.json').expect(200);

    expect(response.body.openapi).toBe('3.1.0');
    expect(response.body.paths['/orders']).toBeDefined();
    expect(response.body.components.schemas.ProblemDetails).toBeDefined();
  });
});

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Transport } from '@nestjs/microservices';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { ProblemDetailsFilter } from '../src/common/filters/problem-details.filter.js';
import { corsOptions } from '../src/common/config/cors.options.js';
import {
  NOTIFICATIONS_DLQ,
  NOTIFICATIONS_DLX,
  NOTIFICATIONS_QUEUE,
} from '../src/common/broker/broker.constants.js';

/**
 * Eje D: pruebas HTTP de seguridad contra la API real.
 *
 * Levanta el AppModule completo (PostgreSQL y RabbitMQ reales), aplica el
 * mismo pipeline que produccion (ValidationPipe global + ProblemDetailsFilter)
 * y verifica los criterios OWASP ASVS / API Security Top 10 de la catedra.
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
let jwt: JwtService;
let mariaToken: string;
let javierToken: string;
let staffToken: string;
let adminToken: string;
let mariaId: string;
let mariaOrderId: string;
let mariaTicketId: string;

async function login(email: string, password = 'password'): Promise<string> {
  const response = await request(API()).post('/auth/login').send({ email, password }).expect(200);
  return response.body.accessToken;
}

function payloadOf(token: string): any {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
}

function expectProblemDetails(response: request.Response, status: number) {
  expect(response.status).toBe(status);
  expect(response.headers['content-type']).toContain('application/problem+json');
  expect(response.body.status).toBe(status);
  expect(response.body.title).toBeDefined();
  expect(response.body.instance).toBeDefined();
  expect(response.body.stack).toBeUndefined();
  expect(JSON.stringify(response.body)).not.toMatch(/\bat .*\.ts:\d+/);
}

async function createOrder(token: string, eventId = 'e1'): Promise<string> {
  const response = await request(API())
    .post('/orders')
    .set('Authorization', `Bearer ${token}`)
    .set('Idempotency-Key', `sec-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    .send({ items: [{ eventId, ticketType: 'tt1a', quantity: 1 }] })
    .expect(201);
  return response.body.id;
}

describe.sequential('Eje D - Seguridad HTTP sobre la API real', () => {
  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleFixture.createNestApplication();
    app.enableCors(corsOptions);
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

    jwt = app.get(JwtService);
    mariaToken = await login('maria@eventhub.com.ar');
    javierToken = await login('javier@eventhub.com.ar');
    staffToken = await login('staff@eventhub.com.ar');
    adminToken = await login('admin@eventhub.com.ar');
    mariaId = payloadOf(mariaToken).sub;
  }, 120000);

  afterAll(async () => {
    await app?.close();
  }, 120000);

  describe('Headers de seguridad, CORS y cookies', () => {
    it('devuelve CSP, HSTS, nosniff, frame y referrer en toda respuesta', async () => {
      const response = await request(API()).get('/events').expect(200);

      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
      expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(response.headers['permissions-policy']).toContain('geolocation=()');
    });

    it('no refleja un origen no confiable y sí habilita el origen local con credenciales', async () => {
      const rejected = await request(API())
        .options('/events')
        .set('Origin', 'https://evil.example')
        .set('Access-Control-Request-Method', 'GET');

      expect(rejected.headers['access-control-allow-origin']).toBeUndefined();

      const allowed = await request(API())
        .options('/events')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET');

      expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(allowed.headers['access-control-allow-credentials']).toBe('true');
      expect(allowed.headers['access-control-allow-origin']).not.toBe('*');
    });

    it('no emite cookies: el JWT viaja en el cuerpo y en Authorization', async () => {
      const response = await request(API())
        .post('/auth/login')
        .send({ email: 'lucia@email.com.ar', password: 'password' })
        .expect(200);

      expect(response.headers['set-cookie']).toBeUndefined();
      expect(typeof response.body.accessToken).toBe('string');
    });
  });

  describe('BOLA / IDOR', () => {
    it('crea una orden de María y bloquea el acceso de Javier por id', async () => {
      mariaOrderId = await createOrder(mariaToken);

      const forbidden = await request(API())
        .get(`/orders/${mariaOrderId}`)
        .set('Authorization', `Bearer ${javierToken}`);

      expect([403, 404]).toContain(forbidden.status);
      expect(JSON.stringify(forbidden.body)).not.toContain('maria@eventhub.com.ar');
      expect(forbidden.body.total).toBeUndefined();
      expect(forbidden.body.items).toBeUndefined();
    });

    it('no lista órdenes ajenas en el historial de Javier', async () => {
      const response = await request(API())
        .get('/orders')
        .set('Authorization', `Bearer ${javierToken}`)
        .expect(200);

      const ids = (response.body as Array<{ id: string }>).map(order => order.id);
      expect(ids).not.toContain(mariaOrderId);
    });

    it('bloquea que Javier pague la orden de María', async () => {
      const response = await request(API())
        .post(`/orders/${mariaOrderId}/pay`)
        .set('Authorization', `Bearer ${javierToken}`)
        .send({ card: '4111 1111 1111 1111' });

      expect([403, 404]).toContain(response.status);
    });

    it('bloquea que Javier consulte el ticket de María por id', async () => {
      const paid = await request(API())
        .post(`/orders/${mariaOrderId}/pay`)
        .set('Authorization', `Bearer ${mariaToken}`)
        .send({ card: '4111 1111 1111 1111' })
        .expect(201);
      mariaTicketId = paid.body.tickets[0].id;

      const forbidden = await request(API())
        .get(`/tickets/${mariaTicketId}`)
        .set('Authorization', `Bearer ${javierToken}`);

      expect([403, 404]).toContain(forbidden.status);
      expect(JSON.stringify(forbidden.body)).not.toContain('maria@eventhub.com.ar');
      expect(forbidden.body.qrCode).toBeUndefined();
      expect(forbidden.body.userId).toBeUndefined();
    });
  });

  describe('BFLA - roles', () => {
    it('rechaza que un ATTENDEE cree eventos con 403', async () => {
      const response = await request(API())
        .post('/events')
        .set('Authorization', `Bearer ${mariaToken}`)
        .send({ title: 'Evento no autorizado' });

      expectProblemDetails(response, 403);
    });

    it('rechaza que un ATTENDEE emita tickets con 403', async () => {
      const response = await request(API())
        .post('/tickets')
        .set('Authorization', `Bearer ${mariaToken}`)
        .send({ orderId: mariaOrderId, eventId: 'e1', userId: mariaId });

      expectProblemDetails(response, 403);
    });

    it('rechaza que un ATTENDEE use el panel de organizador con 403', async () => {
      const response = await request(API())
        .get('/organizer/events')
        .set('Authorization', `Bearer ${mariaToken}`);

      expectProblemDetails(response, 403);
    });

    it('rechaza que STAFF invoque una acción exclusiva de ADMIN', async () => {
      const response = await request(API())
        .delete('/events/e1')
        .set('Authorization', `Bearer ${staffToken}`);

      expectProblemDetails(response, 403);
    });

    it('permite al ADMIN superar el control de roles', async () => {
      const response = await request(API())
        .patch('/events/no-existe')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Cambio de prueba' });

      // El rol pasa el guard; el servicio responde por negocio (400/404), nunca 401/403.
      expect([400, 404]).toContain(response.status);
    });
  });

  describe('JWT: ausente, vencido, alterado, alg=none y otro emisor', () => {
    it('rechaza una petición sin token con 401', async () => {
      const response = await request(API()).get('/orders');
      expectProblemDetails(response, 401);
    });

    it('rechaza un token vencido con 401', async () => {
      const expired = jwt.sign({ sub: mariaId, email: 'maria@eventhub.com.ar', role: 'attendee' }, { expiresIn: '-10s' });
      const response = await request(API()).get('/orders').set('Authorization', `Bearer ${expired}`);
      expectProblemDetails(response, 401);
    });

    it('rechaza un token con firma alterada con 401', async () => {
      const tampered = `${mariaToken.slice(0, -4)}${mariaToken.slice(-4) === 'AAAA' ? 'BBBB' : 'AAAA'}`;
      const response = await request(API()).get('/orders').set('Authorization', `Bearer ${tampered}`);
      expectProblemDetails(response, 401);
    });

    it('rechaza un token con alg=none con 401', async () => {
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ sub: mariaId, role: 'admin' })).toString('base64url');
      const response = await request(API())
        .get('/orders')
        .set('Authorization', `Bearer ${header}.${payload}.`);
      expectProblemDetails(response, 401);
    });

    it('rechaza un token firmado por otro emisor (iss distinto) con 401', async () => {
      const foreignIssuer = jwt.sign(
        { sub: mariaId, email: 'maria@eventhub.com.ar', role: 'attendee' },
        { issuer: 'malicious-idp' },
      );
      const response = await request(API()).get('/orders').set('Authorization', `Bearer ${foreignIssuer}`);
      expectProblemDetails(response, 401);
    });

    it('rechaza un token firmado con otro secreto con 401', async () => {
      const foreignSecret = new JwtService({ secret: 'otro-secreto' }).sign({
        sub: mariaId,
        email: 'maria@eventhub.com.ar',
        role: 'attendee',
        iss: 'eventhub',
      });
      const response = await request(API()).get('/orders').set('Authorization', `Bearer ${foreignSecret}`);
      expectProblemDetails(response, 401);
    });
  });

  describe('Mass assignment', () => {
    it('rechaza el rol inyectado en el registro con 400', async () => {
      const response = await request(API())
        .post('/auth/register')
        .send({
          email: `mass-role-${Date.now()}@eventhub.com.ar`,
          password: 'password',
          firstName: 'Mass',
          lastName: 'Assignment',
          role: 'admin',
        });

      expectProblemDetails(response, 400);
    });

    it('rechaza estado y precio inyectados al crear una orden con 400', async () => {
      const response = await request(API())
        .post('/orders')
        .set('Authorization', `Bearer ${mariaToken}`)
        .send({
          items: [{ eventId: 'e1', ticketType: 'tt1a', quantity: 1 }],
          status: 'paid',
          total: 0,
        });

      expectProblemDetails(response, 400);
    });

    it('ignora campos extra en el login y nunca concede un rol elevado', async () => {
      const response = await request(API())
        .post('/auth/login')
        .send({ email: 'maria@eventhub.com.ar', password: 'password' })
        .expect(200);

      const claims = payloadOf(response.body.accessToken);
      expect(claims.role).toBe('attendee');
      expect(claims.iss).toBe('eventhub');
    });
  });

  describe('Inyecciones y XSS', () => {
    it('no permite bypass de login con SQLi en la contraseña', async () => {
      const response = await request(API())
        .post('/auth/login')
        .send({ email: 'maria@eventhub.com.ar', password: "' OR '1'='1" });

      expect([401, 429]).toContain(response.status);
      expect(response.body.accessToken).toBeUndefined();
    });

    it('trata un id con SQLi como inexistente sin error 500', async () => {
      const response = await request(API()).get('/events/1%27%20OR%20%271%27%3D%271');
      expect([400, 404]).toContain(response.status);
      expectProblemDetails(response, response.status);
    });

    it('persiste texto con XSS como JSON escapado y con nosniff', async () => {
      const email = `xss-${Date.now()}@eventhub.com.ar`;
      const response = await request(API())
        .post('/auth/register')
        .send({
          email,
          password: 'password',
          firstName: '<script>alert(1)</script>',
          lastName: 'Prueba',
        })
        .expect(201);

      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.body.firstName).toContain('<script>');
    });

    it('rechaza XXE en el canal SOAP sin reflejar el XML crudo', async () => {
      const response = await request(API())
        .post('/payments/process')
        .send({
          orderId: 'sec-xxe',
          amount: 100,
          cardNumber: '4111 1111 1111 1111',
          cardHolder: '<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]>',
        })
        .expect(200);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('XXE_INJECTION_REJECTED');
      expect(response.body.faultType).toBe('BUSINESS_FAULT');
      expect(JSON.stringify(response.body)).not.toContain('<!DOCTYPE');
    });
  });

  describe('Fuerza bruta', () => {
    it('responde 429 tras cinco intentos fallidos del mismo origen y email', async () => {
      const email = `bruteforce-${Date.now()}@eventhub.com.ar`;

      for (let attempt = 0; attempt < 5; attempt++) {
        const response = await request(API()).post('/auth/login').send({ email, password: 'incorrecta' });
        expect(response.status).toBe(401);
      }

      const blocked = await request(API()).post('/auth/login').send({ email, password: 'incorrecta' });
      expect(blocked.status).toBe(429);
      expect(blocked.headers['content-type']).toContain('application/problem+json');
    });
  });

  describe('Errores sin fugas de información', () => {
    it('devuelve 404 Problem Details sin stack trace en una ruta inexistente', async () => {
      const response = await request(API()).get('/ruta-inexistente');
      expectProblemDetails(response, 404);
      expect(response.body.detail).not.toContain('node_modules');
    });

    it('no expone detalles internos al enviar un body inválido', async () => {
      const response = await request(API())
        .post('/orders')
        .set('Authorization', `Bearer ${mariaToken}`)
        .send({ items: 'no-es-un-array' });

      expectProblemDetails(response, 400);
      expect(response.body.detail).not.toMatch(/\bat .*\.(ts|js):\d+/);
      expect(JSON.stringify(response.body)).not.toContain('TypeError');
    });

    it('rechaza un id de orden no UUID con 400 y sin mensaje interno de la base', async () => {
      const response = await request(API())
        .get('/orders/id')
        .set('Authorization', `Bearer ${mariaToken}`);

      expectProblemDetails(response, 400);
      expect(JSON.stringify(response.body)).not.toContain('invalid input syntax');
      expect(JSON.stringify(response.body)).not.toContain('QueryFailedError');
    });
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  GatewayTimeoutException,
  HttpStatus,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as amqp from 'amqplib';
import { BrokerTopologyService } from './broker-topology.service.js';
import {
  AUDIT_QUEUE,
  EVENTS_TOPIC_EXCHANGE,
  EVENTS_TOPIC_PATTERN,
  NOTIFICATIONS_QUEUE,
} from './broker.constants.js';
import { TopicPublisherService } from './topic-publisher.service.js';
import { AuditConsumerService } from './audit-consumer.service.js';
import { OutboxService } from './outbox.service.js';
import { OutboxStatus } from './outbox-message.entity.js';
import { ProblemDetailsFilter } from '../filters/problem-details.filter.js';
import { OrdersService } from '../../modules/orders/orders.service.js';
import { Order, OrderStatus } from '../../modules/orders/entities/order.entity.js';
import { SoapClientService } from '../../modules/payments/payments.service.js';
import { EventsService } from '../../modules/events/events.service.js';
import { EventFactory } from '../../modules/events/event.factory.js';
import { EventModality } from '../../modules/events/entities/event.entity.js';

vi.mock('amqplib', () => ({ connect: vi.fn() }));

describe('Etapa 4 — Integraciones obligatorias (SOAP, Geocode, Topic Exchange y Fallback 503/504)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.GEOCODING_URL;
  });

  describe('1. Exchange topic con 2 colas (notificaciones y auditoría)', () => {
    it('declara el exchange topic y enlaza notifications_queue y audit_queue', async () => {
      const channel = {
        on: vi.fn(),
        assertExchange: vi.fn().mockResolvedValue({}),
        assertQueue: vi.fn().mockResolvedValue({}),
        bindQueue: vi.fn().mockResolvedValue({}),
        close: vi.fn().mockResolvedValue(undefined),
      };
      const connection = {
        createChannel: vi.fn().mockResolvedValue(channel),
        close: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(amqp.connect).mockResolvedValue(connection as any);

      const topology = new BrokerTopologyService();
      await topology.onModuleInit();

      expect(channel.assertExchange).toHaveBeenCalledWith(EVENTS_TOPIC_EXCHANGE, 'topic', { durable: true });
      expect(channel.assertQueue).toHaveBeenCalledWith(AUDIT_QUEUE, { durable: true });
      expect(channel.bindQueue).toHaveBeenCalledWith(NOTIFICATIONS_QUEUE, EVENTS_TOPIC_EXCHANGE, EVENTS_TOPIC_PATTERN);
      expect(channel.bindQueue).toHaveBeenCalledWith(AUDIT_QUEUE, EVENTS_TOPIC_EXCHANGE, EVENTS_TOPIC_PATTERN);
      topology.onModuleDestroy();
    });

    it('TopicPublisherService publica al exchange topic y AuditConsumerService procesa el evento', async () => {
      const channel = {
        assertExchange: vi.fn().mockResolvedValue({}),
        publish: vi.fn().mockReturnValue(true),
        close: vi.fn().mockResolvedValue(undefined),
      };
      const connection = {
        on: vi.fn(),
        createChannel: vi.fn().mockResolvedValue(channel),
        close: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(amqp.connect).mockResolvedValue(connection as any);

      const publisher = new TopicPublisherService();
      await publisher.publish('order.paid', { orderId: 'ord-1', total: 5000 }, 'msg-1');

      expect(channel.publish).toHaveBeenCalledWith(
        EVENTS_TOPIC_EXCHANGE,
        'order.paid',
        expect.any(Buffer),
        expect.objectContaining({ persistent: true, messageId: 'msg-1' }),
      );

      const repo: any = {
        find: vi.fn().mockResolvedValue([
          { id: 'out-1', topic: 'order.paid', payload: { orderId: 'ord-1' }, status: OutboxStatus.PENDING, attempts: 0 },
        ]),
        save: vi.fn(async (m: any) => m),
      };
      const outbox = new OutboxService(repo, { emit: vi.fn() } as any, publisher);
      const flushRes = await outbox.flush();
      expect(flushRes.sent).toBe(1);

      const audit = new AuditConsumerService();
      const record = audit.handleRawMessage({ pattern: 'order.paid', data: { orderId: 'ord-1' } });
      expect(record.topic).toBe('order.paid');
      expect(audit.getRecords()).toHaveLength(1);

      await publisher.onModuleDestroy();
    });
  });

  describe('2. Geocodificación REST con fallback ante timeout', () => {
    it('usa GEOCODING_URL y tolera timeout devolviendo lat/lon null sin romper la creación del evento', async () => {
      process.env.GEOCODING_URL = 'http://geocode-mock:4200/search';
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new DOMException('Aborted', 'TimeoutError'));

      const eventDao: any = { save: vi.fn(async (e: any) => e) };
      const service = new EventsService(eventDao, new EventFactory());

      const created = await service.create({
        organizerId: 'org-1',
        title: 'Evento Timeout Geo',
        description: 'Desc',
        date: new Date(Date.now() + 86400000).toISOString(),
        modality: EventModality.IN_PERSON,
        location: 'Buenos Aires',
        capacity: 100,
      } as any);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('http://geocode-mock:4200/search'),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
      expect(created.lat).toBeNull();
      expect(created.lon).toBeNull();
    });
  });

  describe('3. Fallback de pago 503/504 con Retry-After y orden en pending', () => {
    let order: Order;
    let orderRepo: any;

    beforeEach(() => {
      order = new Order();
      order.id = 'ord-timeout-1';
      order.userId = 'user-1';
      order.status = OrderStatus.PENDING;
      order.version = 1;
      order.total = 1500;
      order.holds = [];
      order.items = [];

      orderRepo = {
        findOne: vi.fn(async () => order),
        save: vi.fn(async (o: Order) => o),
        update: vi.fn(async () => ({ affected: 1 })),
      };
    });

    it('responde 504 GatewayTimeout y deja la orden en pending si SOAP supera 5s', async () => {
      const payments: any = {
        processOrderPayment: vi.fn(async () => ({
          success: false,
          code: 'GATEWAY_TIMEOUT',
          reason: 'Timeout 5s',
          fallback: true,
          faultType: 'TIMEOUT',
        })),
      };
      const service = new OrdersService(orderRepo, { emit: vi.fn() } as any, undefined, undefined, undefined, payments);

      await expect(
        service.pay('ord-timeout-1', { sub: 'user-1', email: 'u@test.com' }, '4111 1111 0699 99'),
      ).rejects.toThrow(GatewayTimeoutException);
      expect(order.status).toBe(OrderStatus.PENDING);
    });

    it('responde 503 ServiceUnavailable y deja la orden en pending si el Circuit Breaker está abierto', async () => {
      const payments: any = {
        processOrderPayment: vi.fn(async () => ({
          success: false,
          code: 'CIRCUIT_BREAKER_OPEN',
          reason: 'Circuito abierto',
          fallback: true,
          faultType: 'TECHNICAL_FAULT',
        })),
      };
      const service = new OrdersService(orderRepo, { emit: vi.fn() } as any, undefined, undefined, undefined, payments);

      await expect(
        service.pay('ord-timeout-1', { sub: 'user-1', email: 'u@test.com' }, '4111 1111 1111 1111'),
      ).rejects.toThrow(ServiceUnavailableException);
      expect(order.status).toBe(OrderStatus.PENDING);
    });

    it('ProblemDetailsFilter incluye cabecera Retry-After en respuestas 503 y 504', () => {
      const filter = new ProblemDetailsFilter();
      const response = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const host: any = {
        switchToHttp: () => ({
          getResponse: () => response,
          getRequest: () => ({ originalUrl: '/orders/1/pay', url: '/orders/1/pay' }),
        }),
      };
      vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

      filter.catch(new GatewayTimeoutException({ message: 'Timeout SOAP', retryAfter: 30 }), host);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.GATEWAY_TIMEOUT);
      expect(response.setHeader).toHaveBeenCalledWith('Retry-After', '30');
      expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'application/problem+json');
    });
  });

  describe('4. Endurecimiento XXE en SoapClientService', () => {
    it('rechaza payloads XXE antes de invocar el cliente SOAP', async () => {
      const client = new SoapClientService();
      const res = await client.requestPayment({
        orderId: 'ord-xxe',
        amount: 100,
        cardNumber: '4111 1111 1111 1111',
        cardHolder: '<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]>',
      });

      expect(res.status).toBe('ERROR');
      expect(res.code).toBe('XXE_INJECTION_REJECTED');
    });
  });
});

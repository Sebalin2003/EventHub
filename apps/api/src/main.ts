import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ProblemDetailsFilter } from './common/filters/problem-details.filter.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security: CORS configured with explicit parameters, no wildcard with credentials
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow localhost dev servers or same origin
      if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin) || origin.endsWith('eventhub.com')) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'If-Match', 'X-Requested-With'],
    exposedHeaders: ['ETag'],
  });

  // REST standard: RFC 9457 Problem Details Exception Filter
  app.useGlobalFilters(new ProblemDetailsFilter());

  // Security: Prevent Mass Assignment by stripping non-whitelisted properties
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // RabbitMQ Microservice connection
  try {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://user:password@localhost:5672'],
        queue: 'notifications_queue',
        queueOptions: {
          durable: true,
        },
      },
    });
    await app.startAllMicroservices();
    logger.log('RabbitMQ Microservice connected and started');
  } catch (err) {
    logger.warn(`RabbitMQ connection skipped or unavailable during bootstrap: ${err}`);
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`EventHub API running on port ${port}`);
}
await bootstrap();

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { readFileSync } from 'node:fs';
import { AppModule } from './app.module.js';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ProblemDetailsFilter } from './common/filters/problem-details.filter.js';
import { corsOptions } from './common/config/cors.options.js';
import {
  NOTIFICATIONS_DLQ,
  NOTIFICATIONS_DLX,
  NOTIFICATIONS_QUEUE,
  rabbitMqUrl,
} from './common/broker/broker.constants.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET is required in production');
    logger.warn('JWT_SECRET not set; using the development secret');
  }

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    // Eje D: TLS directo opcional. En produccion se recomienda terminacion en proxy.
    process.env.TLS_CERT_PATH && process.env.TLS_KEY_PATH
      ? {
          httpsOptions: {
            key: readFileSync(process.env.TLS_KEY_PATH),
            cert: readFileSync(process.env.TLS_CERT_PATH),
          },
        }
      : {},
  );
  app.disable('x-powered-by');

  // Security: CORS configured with explicit parameters, no wildcard with credentials
  app.enableCors(corsOptions);

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
        urls: [rabbitMqUrl()],
        queue: NOTIFICATIONS_QUEUE,
        noAck: false,
        queueOptions: {
          durable: true,
          deadLetterExchange: NOTIFICATIONS_DLX,
          deadLetterRoutingKey: NOTIFICATIONS_DLQ,
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

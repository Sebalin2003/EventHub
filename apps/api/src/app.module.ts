import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { OpenApiController } from './openapi.controller.js';
import { IdentityModule } from './modules/identity/identity.module.js';
import { EventsModule } from './modules/events/events.module.js';
import { InventoryModule } from './modules/inventory/inventory.module.js';
import { OrdersModule } from './modules/orders/orders.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { TicketsModule } from './modules/tickets/tickets.module.js';
import { CheckInModule } from './modules/check-in/check-in.module.js';
import { FavoritesModule } from './modules/favorites/favorites.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { AiModule } from './modules/ai/ai.module.js';
import { OutboxModule } from './common/broker/outbox.module.js';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware.js';
import { NestModule, MiddlewareConsumer } from '@nestjs/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const isProd = configService.get<string>('NODE_ENV') === 'production';
        const sync = configService.get<string>('DB_SYNCHRONIZE') === 'true' || !isProd;
        const dbSslEnv = configService.get<string>('DB_SSL');
        const sslRequired = dbSslEnv !== undefined
          ? dbSslEnv === 'true'
          : (databaseUrl ? (isProd && !databaseUrl.includes('railway.internal')) : false);

        return {
          type: 'postgres',
          ...(databaseUrl
            ? { url: databaseUrl }
            : {
                host: configService.get<string>('DB_HOST', 'localhost'),
                port: configService.get<number>('DB_PORT', 5432),
                username: configService.get<string>('DB_USERNAME', 'user'),
                password: configService.get<string>('DB_PASSWORD', 'password'),
                database: configService.get<string>('DB_DATABASE', 'evenhub'),
              }),
          ssl: sslRequired ? { rejectUnauthorized: false } : false,
          autoLoadEntities: true,
          synchronize: sync,
        };
      },
      inject: [ConfigService],
    }),
    OutboxModule,
    IdentityModule, 
    EventsModule, 
    InventoryModule, 
    OrdersModule, 
    PaymentsModule, 
    TicketsModule, 
    CheckInModule, 
    FavoritesModule, 
    NotificationsModule,
    AiModule,
  ],
  controllers: [AppController, OpenApiController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityHeadersMiddleware).forRoutes('*');
  }
}

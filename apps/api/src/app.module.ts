import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
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
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'user'),
        password: configService.get<string>('DB_PASSWORD', 'password'),
        database: configService.get<string>('DB_DATABASE', 'evenhub'),
        autoLoadEntities: true,
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),
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
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityHeadersMiddleware).forRoutes('*');
  }
}

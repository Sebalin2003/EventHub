import { Module } from '@nestjs/common';
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

@Module({
  imports: [IdentityModule, EventsModule, InventoryModule, OrdersModule, PaymentsModule, TicketsModule, CheckInModule, FavoritesModule, NotificationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

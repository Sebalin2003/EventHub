import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller.js';
import { InventoryService } from './inventory.service.js';
import { IdentityModule } from '../identity/identity.module.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from './entities/inventory.entity.js';
import { InventoryDao } from './inventory.dao.js';

@Module({
	imports: [IdentityModule, TypeOrmModule.forFeature([Inventory])],
	controllers: [InventoryController],
	providers: [InventoryService, InventoryDao, JwtAuthGuard, RolesGuard],
	exports: [InventoryService],
})
export class InventoryModule {}

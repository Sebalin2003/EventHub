import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Favorite } from './entities/favorite.entity.js';
import { FavoriteDao } from './favorite.dao.js';
import { FavoritesController } from './favorites.controller.js';
import { FavoritesService } from './favorites.service.js';
import { IdentityModule } from '../identity/identity.module.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { EventsModule } from '../events/events.module.js';

@Module({
	imports: [TypeOrmModule.forFeature([Favorite]), IdentityModule, EventsModule],
	controllers: [FavoritesController],
	providers: [FavoritesService, FavoriteDao, JwtAuthGuard],
	exports: [FavoritesService],
})
export class FavoritesModule {}

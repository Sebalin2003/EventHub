import { Controller, Delete, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { FavoritesService } from './favorites.service.js';

/**
 * Favorites controller — presentation layer.
 *
 */
@Controller('me/favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  list(@Req() req: { user: { sub: string } }) {
    const userId = req.user.sub;
    return this.favorites.listByUser(userId);
  }

  @Put(':eventId')
  add(@Req() req: { user: { sub: string } }, @Param('eventId') eventId: string) {
    const userId = req.user.sub;
    return this.favorites.addFavorite(userId, eventId);
  }

  @Delete(':eventId')
  remove(@Req() req: { user: { sub: string } }, @Param('eventId') eventId: string) {
    const userId = req.user.sub;
    return this.favorites.removeFavorite(userId, eventId);
  }
}

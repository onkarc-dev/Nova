import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { InventoryReservationService } from './inventory-reservation.service';

@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryReservationService: InventoryReservationService) {}

  @Get('cart/:cartId/validate')
  validateCart(@CurrentUser() user: AuthUser, @Param('cartId') cartId: string) {
    return this.inventoryReservationService.validateBuyerCart(user, cartId);
  }
}

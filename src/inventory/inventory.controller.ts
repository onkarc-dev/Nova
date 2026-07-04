import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
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

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('seller')
@Controller('seller/inventory')
export class SellerInventoryController {
  constructor(private readonly inventoryReservationService: InventoryReservationService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.inventoryReservationService.listSellerInventory(user);
  }

  @Patch(':variantId')
  update(@CurrentUser() user: AuthUser, @Param('variantId') variantId: string, @Body() dto: { onHand?: number; reserved?: number; safetyStock?: number }) {
    return this.inventoryReservationService.updateSellerInventory(user, variantId, dto);
  }
}

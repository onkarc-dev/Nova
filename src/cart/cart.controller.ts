import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartService } from './cart.service';

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: AuthUser) {
    return this.cartService.getCart(user);
  }

  @Post('items')
  addItem(@CurrentUser() user: AuthUser, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(user, dto);
  }

  @Patch('items/:id')
  updateItem(@CurrentUser() user: AuthUser, @Param('id') itemId: string, @Body() dto: UpdateCartItemDto) {
    return this.cartService.updateItem(user, itemId, dto);
  }

  @Delete('items/:id')
  removeItem(@CurrentUser() user: AuthUser, @Param('id') itemId: string) {
    return this.cartService.removeItem(user, itemId);
  }

  @Delete()
  clearCart(@CurrentUser() user: AuthUser) {
    return this.cartService.clearCart(user);
  }
}

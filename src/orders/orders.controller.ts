import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { OrdersService } from './orders.service';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  listOrders(@CurrentUser() user: AuthUser) {
    return this.ordersService.listOrders(user);
  }

  @Get(':id')
  getOrder(@CurrentUser() user: AuthUser, @Param('id') orderId: string) {
    return this.ordersService.getOrder(user, orderId);
  }
}

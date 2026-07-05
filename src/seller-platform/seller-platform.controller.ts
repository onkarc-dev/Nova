import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { SellerOrderQueryDto, SellerTrackingDto } from './dto/seller-order-query.dto';
import { SellerPlatformService } from './seller-platform.service';

@UseGuards(JwtAuthGuard)
@Controller('seller')
export class SellerPlatformController {
  constructor(private readonly sellerPlatformService: SellerPlatformService) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthUser) {
    return this.sellerPlatformService.dashboard(user);
  }

  @Get('orders')
  listOrders(@CurrentUser() user: AuthUser, @Query() query: SellerOrderQueryDto) {
    return this.sellerPlatformService.listOrders(user, query);
  }

  @Get('orders/summary')
  orderSummary(@CurrentUser() user: AuthUser, @Query() query: SellerOrderQueryDto) {
    return this.sellerPlatformService.orderSummary(user, query);
  }

  @Get('orders/:orderId')
  getOrderDetail(@CurrentUser() user: AuthUser, @Param('orderId') orderId: string) {
    return this.sellerPlatformService.getOrderDetail(user, orderId);
  }

  @Patch('orders/:orderId/packed')
  markPacked(@CurrentUser() user: AuthUser, @Param('orderId') orderId: string) {
    return this.sellerPlatformService.markOrderPacked(user, orderId);
  }

  @Patch('orders/:orderId/ready-to-ship')
  markReadyToShip(@CurrentUser() user: AuthUser, @Param('orderId') orderId: string) {
    return this.sellerPlatformService.markOrderReadyToShip(user, orderId);
  }

  @Patch('orders/:orderId/tracking')
  updateTracking(@CurrentUser() user: AuthUser, @Param('orderId') orderId: string, @Body() dto: SellerTrackingDto) {
    return this.sellerPlatformService.updateOrderTracking(user, orderId, dto);
  }
}

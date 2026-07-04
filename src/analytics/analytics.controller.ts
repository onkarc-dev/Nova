import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { AnalyticsService } from './analytics.service';

@UseGuards(JwtAuthGuard, RolesGuard)
export class BaseAnalyticsController {
  constructor(protected readonly analyticsService: AnalyticsService) {}
}

@Roles('admin')
@Controller('admin/analytics')
export class AdminAnalyticsController extends BaseAnalyticsController {
  @Get('revenue')
  revenue() {
    return this.analyticsService.adminRevenue();
  }

  @Get('categories')
  categories() {
    return this.analyticsService.categories();
  }

  @Get('products')
  products() {
    return this.analyticsService.adminProducts();
  }
}

@Roles('seller')
@Controller('seller/analytics')
export class SellerAnalyticsController extends BaseAnalyticsController {
  @Get('revenue')
  revenue(@CurrentUser() user: AuthUser) {
    return this.analyticsService.sellerRevenue(user);
  }

  @Get('products')
  products(@CurrentUser() user: AuthUser) {
    return this.analyticsService.sellerProducts(user);
  }
}


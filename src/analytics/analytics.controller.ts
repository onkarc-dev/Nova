import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { AdminAnalyticsService } from './admin-analytics.service';
import { SellerAnalyticsService } from './seller-analytics.service';
import {
  AnalyticsExportQueryDto,
  AnalyticsListQueryDto,
  AnalyticsPeriodQueryDto,
  AnalyticsTimeSeriesQueryDto,
  SellerAnalyticsTimeSeriesQueryDto,
} from './dto/analytics-query.dto';

function sendCsv(res: Response, filename: string, csv: string): void {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/analytics')
export class AdminAnalyticsController {
  constructor(private readonly analytics: AdminAnalyticsService) {}

  @Get('overview')
  overview(@Query() query: AnalyticsPeriodQueryDto) {
    return this.analytics.overview(query);
  }

  @Get('revenue')
  revenue(@Query() query: AnalyticsTimeSeriesQueryDto) {
    return this.analytics.revenue(query);
  }

  @Get('orders')
  orders(@Query() query: AnalyticsTimeSeriesQueryDto) {
    return this.analytics.orders(query);
  }

  @Get('payments')
  payments(@Query() query: AnalyticsPeriodQueryDto) {
    return this.analytics.payments(query);
  }

  @Get('shipments')
  shipments(@Query() query: AnalyticsPeriodQueryDto) {
    return this.analytics.shipments(query);
  }

  @Get('returns')
  returns(@Query() query: AnalyticsPeriodQueryDto) {
    return this.analytics.returns(query);
  }

  @Get('products')
  products(@Query() query: AnalyticsListQueryDto) {
    return this.analytics.products(query);
  }

  @Get('sellers')
  sellers(@Query() query: AnalyticsListQueryDto) {
    return this.analytics.sellers(query);
  }

  @Get('categories')
  categories(@Query() query: AnalyticsListQueryDto) {
    return this.analytics.categories(query);
  }

  @Get('inventory')
  inventory(@Query() query: AnalyticsListQueryDto) {
    return this.analytics.inventory(query);
  }

  @Get('export')
  async export(@Query() query: AnalyticsExportQueryDto, @Res({ passthrough: false }) res: Response) {
    const { csv, filename } = await this.analytics.exportCsv(query);
    sendCsv(res, filename, csv);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('seller')
@Controller('seller/analytics')
export class SellerAnalyticsController {
  constructor(private readonly analytics: SellerAnalyticsService) {}

  @Get('overview')
  overview(@CurrentUser() user: AuthUser, @Query() query: AnalyticsPeriodQueryDto) {
    return this.analytics.overview(user, query);
  }

  @Get('revenue')
  revenue(@CurrentUser() user: AuthUser, @Query() query: SellerAnalyticsTimeSeriesQueryDto) {
    return this.analytics.revenue(user, query);
  }

  @Get('orders')
  orders(@CurrentUser() user: AuthUser, @Query() query: SellerAnalyticsTimeSeriesQueryDto) {
    return this.analytics.orders(user, query);
  }

  @Get('products')
  products(@CurrentUser() user: AuthUser, @Query() query: AnalyticsListQueryDto) {
    return this.analytics.products(user, query);
  }

  @Get('inventory')
  inventory(@CurrentUser() user: AuthUser, @Query() query: AnalyticsListQueryDto) {
    return this.analytics.inventory(user, query);
  }

  @Get('shipments')
  shipments(@CurrentUser() user: AuthUser, @Query() query: AnalyticsPeriodQueryDto) {
    return this.analytics.shipments(user, query);
  }

  @Get('returns')
  returns(@CurrentUser() user: AuthUser, @Query() query: AnalyticsPeriodQueryDto) {
    return this.analytics.returns(user, query);
  }

  @Get('export')
  async export(@CurrentUser() user: AuthUser, @Query() query: AnalyticsExportQueryDto, @Res({ passthrough: false }) res: Response) {
    const { csv, filename } = await this.analytics.exportCsv(user, query);
    sendCsv(res, filename, csv);
  }
}

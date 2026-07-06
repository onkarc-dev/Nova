import { Module } from '@nestjs/common';
import { AdminAnalyticsController, SellerAnalyticsController } from './analytics.controller';
import { AnalyticsAggregationService } from './analytics-aggregation.service';
import { AdminAnalyticsService } from './admin-analytics.service';
import { SellerAnalyticsService } from './seller-analytics.service';

@Module({
  controllers: [AdminAnalyticsController, SellerAnalyticsController],
  providers: [AnalyticsAggregationService, AdminAnalyticsService, SellerAnalyticsService],
  exports: [AnalyticsAggregationService],
})
export class AnalyticsModule {}

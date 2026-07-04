import { Module } from '@nestjs/common';
import { AdminAnalyticsController, SellerAnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  controllers: [AdminAnalyticsController, SellerAnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}


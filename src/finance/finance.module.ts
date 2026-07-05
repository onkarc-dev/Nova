import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@database/database.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { FinanceAdminController, FinanceSellerController } from './finance.controller';
import { FinanceService } from './finance.service';

@Module({
  imports: [ConfigModule, DatabaseModule, NotificationsModule],
  controllers: [FinanceSellerController, FinanceAdminController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}

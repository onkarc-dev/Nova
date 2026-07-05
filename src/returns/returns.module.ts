import { Module } from '@nestjs/common';
import { NotificationsModule } from '@/notifications/notifications.module';
import { FinanceModule } from '@/finance/finance.module';
import { AdminReturnsController, ReturnsController } from './returns.controller';
import { ReturnsService } from './returns.service';

@Module({
  imports: [NotificationsModule, FinanceModule],
  controllers: [ReturnsController, AdminReturnsController],
  providers: [ReturnsService],
})
export class ReturnsModule {}


import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { FinanceModule } from '@/finance/finance.module';
import { ShipmentsModule } from '@/shipments/shipments.module';
import { SellerPlatformController } from './seller-platform.controller';
import { SellerPlatformService } from './seller-platform.service';

@Module({
  imports: [DatabaseModule, FinanceModule, ShipmentsModule],
  controllers: [SellerPlatformController],
  providers: [SellerPlatformService],
})
export class SellerPlatformModule {}

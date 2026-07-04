import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { AdminShipmentsController, CustomerShipmentTrackingController, SellerShipmentsController } from './shipments.controller';
import { ManualDeliveryProvider } from './providers/manual-delivery.provider';
import { ShipmentsService } from './shipments.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SellerShipmentsController, AdminShipmentsController, CustomerShipmentTrackingController],
  providers: [ManualDeliveryProvider, ShipmentsService],
  exports: [ShipmentsService],
})
export class ShipmentsModule {}

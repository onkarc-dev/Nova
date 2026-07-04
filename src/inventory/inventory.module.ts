import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { InventoryController, SellerInventoryController } from './inventory.controller';
import { InventoryReservationService } from './inventory-reservation.service';

@Module({
  imports: [DatabaseModule],
  controllers: [InventoryController, SellerInventoryController],
  providers: [InventoryReservationService],
  exports: [InventoryReservationService],
})
export class InventoryModule {}

import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { InventoryController } from './inventory.controller';
import { InventoryReservationService } from './inventory-reservation.service';

@Module({
  imports: [DatabaseModule],
  controllers: [InventoryController],
  providers: [InventoryReservationService],
  exports: [InventoryReservationService],
})
export class InventoryModule {}

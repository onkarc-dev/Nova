import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { AdminSellersController, SellersController } from './sellers.controller';
import { SellersService } from './sellers.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SellersController, AdminSellersController],
  providers: [SellersService],
})
export class SellersModule {}

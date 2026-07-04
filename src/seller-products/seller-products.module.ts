import { Module } from '@nestjs/common';
import { SellerProductsController } from './seller-products.controller';
import { SellerProductsService } from './seller-products.service';

@Module({
  controllers: [SellerProductsController],
  providers: [SellerProductsService],
  exports: [SellerProductsService],
})
export class SellerProductsModule {}


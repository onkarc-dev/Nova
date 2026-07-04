import { Module } from '@nestjs/common';
import { SearchModule } from '@/search/search.module';
import { SellerProductsController } from './seller-products.controller';
import { SellerProductsService } from './seller-products.service';

@Module({
  imports: [SearchModule],
  controllers: [SellerProductsController],
  providers: [SellerProductsService],
  exports: [SellerProductsService],
})
export class SellerProductsModule {}


import { Module } from '@nestjs/common';
import { CartModule } from '@/cart/cart.module';
import { DatabaseModule } from '@database/database.module';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';

@Module({
  imports: [CartModule, DatabaseModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}

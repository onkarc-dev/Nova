import { Module } from '@nestjs/common';
import { InventoryModule } from '@/inventory/inventory.module';
import { ManualPendingProvider } from './manual-pending.provider';
import { NullPaymentProvider } from './null-payment.provider';
import { PaymentsController } from './payments.controller';
import { PaymentService } from './payment.service';
import { RazorpayProvider } from './razorpay.provider';

@Module({
  imports: [InventoryModule],
  controllers: [PaymentsController],
  providers: [ManualPendingProvider, NullPaymentProvider, RazorpayProvider, PaymentService],
  exports: [PaymentService],
})
export class PaymentsModule {}

import { Module } from '@nestjs/common';
import { ManualPendingProvider } from './manual-pending.provider';
import { NullPaymentProvider } from './null-payment.provider';
import { PaymentService } from './payment.service';

@Module({
  providers: [ManualPendingProvider, NullPaymentProvider, PaymentService],
  exports: [PaymentService],
})
export class PaymentsModule {}

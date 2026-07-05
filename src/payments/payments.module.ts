import { Module } from '@nestjs/common';
import { InventoryModule } from '@/inventory/inventory.module';
import { ShipmentsModule } from '@/shipments/shipments.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { FinanceModule } from '@/finance/finance.module';
import { ManualPendingProvider } from './manual-pending.provider';
import { NullPaymentProvider } from './null-payment.provider';
import { AdminPaymentsController, PaymentsController } from './payments.controller';
import { PaymentService } from './payment.service';
import { RazorpayProvider } from './razorpay.provider';

@Module({
  imports: [InventoryModule, ShipmentsModule, NotificationsModule, FinanceModule],
  controllers: [PaymentsController, AdminPaymentsController],
  providers: [ManualPendingProvider, NullPaymentProvider, RazorpayProvider, PaymentService],
  exports: [PaymentService],
})
export class PaymentsModule {}

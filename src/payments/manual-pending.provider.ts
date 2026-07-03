import { Injectable } from '@nestjs/common';
import { PaymentProvider, PaymentStatus, Prisma } from '@prisma/client';
import type { CreatePendingPaymentInput, PaymentProviderAdapter } from './payment-provider.interface';

@Injectable()
export class ManualPendingProvider implements PaymentProviderAdapter {
  readonly provider = PaymentProvider.MANUAL_PENDING;

  createPendingPayment(tx: Prisma.TransactionClient, input: CreatePendingPaymentInput) {
    return tx.payment.create({
      data: {
        orderId: input.orderId,
        provider: this.provider,
        status: PaymentStatus.PENDING,
        amountCents: input.amountCents,
        currency: input.currency,
      },
      select: { id: true, provider: true, status: true, amountCents: true, currency: true },
    });
  }
}

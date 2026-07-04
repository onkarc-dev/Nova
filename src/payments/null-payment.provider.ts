import { Injectable } from '@nestjs/common';
import { PaymentProvider, PaymentStatus, Prisma } from '@prisma/client';
import type {
  CreatePendingPaymentInput,
  PaymentProviderAdapter,
  ProviderActionResult,
  ProviderRefundInput,
  VerifyProviderPaymentInput,
} from './payment-provider.interface';

@Injectable()
export class NullPaymentProvider implements PaymentProviderAdapter {
  readonly provider = PaymentProvider.NULL;

  createOrder(tx: Prisma.TransactionClient, input: CreatePendingPaymentInput) {
    return tx.payment.create({
      data: {
        orderId: input.orderId,
        provider: this.provider,
        status: PaymentStatus.CREATED,
        amountCents: input.amountCents,
        currency: input.currency,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
      select: { id: true, provider: true, status: true, amountCents: true, currency: true, providerOrderId: true, providerRef: true },
    });
  }

  verifyPayment(input: VerifyProviderPaymentInput) {
    return Promise.resolve({ verified: false, providerOrderId: input.providerOrderId, providerPaymentId: input.providerPaymentId });
  }

  refundPayment(input: ProviderRefundInput): Promise<ProviderActionResult> {
    return Promise.resolve({ providerRef: `null_refund_${input.refundId}`, status: PaymentStatus.FAILED });
  }
}

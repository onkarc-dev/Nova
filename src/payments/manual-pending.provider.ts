import { Injectable } from '@nestjs/common';
import { PaymentProvider, PaymentStatus, Prisma } from '@prisma/client';
import type {
  CreatePendingPaymentInput,
  PaymentProviderAdapter,
  ProviderActionResult,
  ProviderPaymentStatusResult,
  ProviderRefundInput,
  VerifyProviderPaymentInput,
} from './payment-provider.interface';

@Injectable()
export class ManualPendingProvider implements PaymentProviderAdapter {
  readonly provider = PaymentProvider.MANUAL_DEV;

  createOrder(tx: Prisma.TransactionClient, input: CreatePendingPaymentInput) {
    return tx.payment.create({
      data: {
        orderId: input.orderId,
        provider: this.provider,
        status: PaymentStatus.CREATED,
        amountCents: input.amountCents,
        currency: input.currency,
        providerOrderId: `manual_order_${input.orderId}`,
        providerRef: `manual_order_${input.orderId}`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        metadata: { providerMode: 'manual_dev', receipt: input.receipt ?? null },
      },
      select: { id: true, provider: true, status: true, amountCents: true, currency: true, providerOrderId: true, providerRef: true },
    });
  }

  verifyPayment(input: VerifyProviderPaymentInput) {
    return Promise.resolve({
      verified: Boolean(input.providerPaymentId),
      providerOrderId: input.providerOrderId,
      providerPaymentId: input.providerPaymentId,
      rawResponse: { providerMode: 'manual_dev' },
    });
  }

  refundPayment(input: ProviderRefundInput): Promise<ProviderActionResult> {
    return Promise.resolve({
      providerRef: `manual_refund_${input.refundId}`,
      status: PaymentStatus.REFUNDED,
      rawResponse: { providerMode: 'manual_dev', refundId: input.refundId },
    });
  }

  getPaymentStatus(providerPaymentId: string): Promise<ProviderPaymentStatusResult> {
    return Promise.resolve({ providerPaymentId, status: PaymentStatus.PENDING, rawResponse: { providerMode: 'manual_dev' } });
  }
}

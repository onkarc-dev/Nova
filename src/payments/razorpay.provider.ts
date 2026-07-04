import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { PaymentProvider, PaymentStatus, Prisma } from '@prisma/client';
import type { CreatePendingPaymentInput, PaymentProviderAdapter } from './payment-provider.interface';

@Injectable()
export class RazorpayProvider implements PaymentProviderAdapter {
  readonly provider = PaymentProvider.RAZORPAY;

  constructor(private readonly configService: ConfigService) {}

  createPendingPayment(tx: Prisma.TransactionClient, input: CreatePendingPaymentInput) {
    return tx.payment.create({
      data: {
        orderId: input.orderId,
        provider: this.provider,
        status: PaymentStatus.PENDING,
        amountCents: input.amountCents,
        currency: input.currency,
        providerRef: this.createLocalOrderRef(input.orderId),
      },
      select: { id: true, provider: true, status: true, amountCents: true, currency: true },
    });
  }

  isConfigured(): boolean {
    return Boolean(this.configService.get<string>('payment.razorpayKeyId') && this.configService.get<string>('payment.razorpayKeySecret'));
  }

  getPublicKey(): string | undefined {
    return this.configService.get<string>('payment.razorpayKeyId');
  }

  verifyWebhookSignature(rawBody: string, signature: string | undefined): boolean {
    const secret = this.configService.get<string>('payment.razorpayWebhookSecret');
    if (!secret || !signature) return false;
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    return this.safeEqual(signature, expected);
  }

  private createLocalOrderRef(orderId: string): string {
    return `rzp_local_${orderId}_${String(Date.now())}`;
  }

  private safeEqual(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
  }
}

import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { PaymentProvider, PaymentStatus, Prisma } from '@prisma/client';
import type {
  CreatePendingPaymentInput,
  PaymentProviderAdapter,
  ProviderActionResult,
  ProviderPaymentStatusResult,
  ProviderRefundInput,
  VerifyProviderPaymentInput,
} from './payment-provider.interface';

interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  status?: string;
  notes?: Record<string, string>;
}

interface RazorpayPaymentResponse {
  id: string;
  status?: string;
  amount?: number;
  currency?: string;
}

interface RazorpayRefundResponse {
  id: string;
  status?: string;
  amount?: number;
  currency?: string;
}

@Injectable()
export class RazorpayProvider implements PaymentProviderAdapter {
  readonly provider = PaymentProvider.RAZORPAY;
  private readonly baseUrl = 'https://api.razorpay.com/v1';

  constructor(private readonly configService: ConfigService) {}

  async createOrder(tx: Prisma.TransactionClient, input: CreatePendingPaymentInput) {
    const order = await this.request<RazorpayOrderResponse>('/orders', {
      amount: input.amountCents,
      currency: input.currency,
      receipt: input.receipt ?? input.orderId,
      notes: input.notes,
      payment_capture: 1,
    });

    return tx.payment.create({
      data: {
        orderId: input.orderId,
        provider: this.provider,
        status: PaymentStatus.CREATED,
        amountCents: input.amountCents,
        currency: input.currency,
        providerOrderId: order.id,
        providerRef: order.id,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        metadata: this.toJsonObject(order),
      },
      select: { id: true, provider: true, status: true, amountCents: true, currency: true, providerOrderId: true, providerRef: true },
    });
  }

  isConfigured(): boolean {
    return Boolean(this.configService.get<string>('payment.razorpayKeyId') && this.configService.get<string>('payment.razorpayKeySecret'));
  }

  getPublicKey(): string | undefined {
    return this.configService.get<string>('payment.razorpayKeyId');
  }

  verifyPayment(input: VerifyProviderPaymentInput) {
    if (!input.signature) {
      return Promise.resolve({ verified: false, providerOrderId: input.providerOrderId, providerPaymentId: input.providerPaymentId });
    }

    const expected = this.createSignature(`${input.providerOrderId}|${input.providerPaymentId}`);
    return Promise.resolve({
      verified: this.safeEqual(input.signature, expected),
      providerOrderId: input.providerOrderId,
      providerPaymentId: input.providerPaymentId,
      rawResponse: { signatureVerified: true },
    });
  }

  async capturePayment(input: ProviderRefundInput): Promise<ProviderActionResult> {
    const payment = await this.request<RazorpayPaymentResponse>(`/payments/${encodeURIComponent(input.providerPaymentId)}/capture`, {
      amount: input.amountCents,
      currency: input.currency,
    });
    return {
      providerRef: payment.id,
      status: this.mapPaymentStatus(payment.status),
      rawResponse: this.toJsonObject(payment),
    };
  }

  async refundPayment(input: ProviderRefundInput): Promise<ProviderActionResult> {
    const refund = await this.request<RazorpayRefundResponse>(`/payments/${encodeURIComponent(input.providerPaymentId)}/refund`, {
      amount: input.amountCents,
      notes: input.notes,
      receipt: input.refundId,
    });
    return {
      providerRef: refund.id,
      status: refund.status === 'processed' ? PaymentStatus.REFUNDED : PaymentStatus.PENDING,
      rawResponse: this.toJsonObject(refund),
    };
  }

  async getPaymentStatus(providerPaymentId: string): Promise<ProviderPaymentStatusResult> {
    const payment = await this.request<RazorpayPaymentResponse>(`/payments/${encodeURIComponent(providerPaymentId)}`);
    return {
      providerPaymentId: payment.id,
      status: this.mapPaymentStatus(payment.status),
      rawResponse: this.toJsonObject(payment),
    };
  }

  verifyWebhookSignature(rawBody: string, signature: string | undefined): boolean {
    const secret = this.configService.get<string>('payment.razorpayWebhookSecret');
    if (!secret || !signature) return false;
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    return this.safeEqual(signature, expected);
  }

  private createSignature(payload: string): string {
    const secret = this.configService.get<string>('payment.razorpayKeySecret');
    if (!secret) throw new ServiceUnavailableException('Razorpay credentials are not configured.');
    return createHmac('sha256', secret).update(payload).digest('hex');
  }

  private async request<T>(path: string, body?: Record<string, unknown>): Promise<T> {
    const keyId = this.configService.get<string>('payment.razorpayKeyId');
    const keySecret = this.configService.get<string>('payment.razorpayKeySecret');
    if (!keyId || !keySecret) throw new ServiceUnavailableException('Razorpay credentials are not configured.');

    const init: RequestInit = {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    };
    if (body) init.body = JSON.stringify(body);

    const response = await fetch(`${this.baseUrl}${path}`, init);

    const text = await response.text();
    const payload = text ? (JSON.parse(text) as unknown) : {};
    if (!response.ok) {
      throw new BadRequestException({ message: 'Razorpay request failed.', providerStatus: response.status, providerResponse: payload });
    }
    return payload as T;
  }

  private mapPaymentStatus(status: string | undefined): PaymentStatus {
    if (status === 'authorized') return PaymentStatus.AUTHORIZED;
    if (status === 'captured') return PaymentStatus.CAPTURED;
    if (status === 'failed') return PaymentStatus.FAILED;
    if (status === 'refunded') return PaymentStatus.REFUNDED;
    return PaymentStatus.PENDING;
  }

  private toJsonObject(value: unknown): Prisma.InputJsonObject {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject;
  }

  private safeEqual(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
  }
}

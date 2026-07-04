import type { PaymentProvider, PaymentStatus, Prisma } from '@prisma/client';

export interface CreatePendingPaymentInput {
  orderId: string;
  amountCents: number;
  currency: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface PaymentProviderAdapter {
  readonly provider: PaymentProvider;
  createOrder(tx: Prisma.TransactionClient, input: CreatePendingPaymentInput): Promise<{
    id: string;
    provider: PaymentProvider;
    status: PaymentStatus;
    amountCents: number;
    currency: string;
    providerOrderId: string | null;
    providerRef: string | null;
  }>;
  verifyPayment(input: VerifyProviderPaymentInput): Promise<ProviderVerificationResult>;
  capturePayment?(input: ProviderPaymentActionInput): Promise<ProviderActionResult>;
  refundPayment(input: ProviderRefundInput): Promise<ProviderActionResult>;
  cancelPayment?(input: ProviderPaymentActionInput): Promise<ProviderActionResult>;
  getPaymentStatus?(providerPaymentId: string): Promise<ProviderPaymentStatusResult>;
}

export interface VerifyProviderPaymentInput {
  providerOrderId: string;
  providerPaymentId: string;
  signature?: string;
}

export interface ProviderPaymentActionInput {
  providerPaymentId: string;
  amountCents: number;
  currency: string;
}

export interface ProviderRefundInput extends ProviderPaymentActionInput {
  refundId: string;
  notes?: Record<string, string>;
}

export interface ProviderVerificationResult {
  verified: boolean;
  providerPaymentId: string;
  providerOrderId?: string;
  rawResponse?: Prisma.InputJsonValue;
}

export interface ProviderActionResult {
  providerRef: string;
  status: PaymentStatus;
  rawResponse?: Prisma.InputJsonValue;
}

export interface ProviderPaymentStatusResult {
  providerPaymentId: string;
  status: PaymentStatus;
  rawResponse?: Prisma.InputJsonValue;
}

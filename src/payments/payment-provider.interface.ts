import type { PaymentProvider, PaymentStatus, Prisma } from '@prisma/client';

export interface CreatePendingPaymentInput {
  orderId: string;
  amountCents: number;
  currency: string;
}

export interface PaymentProviderAdapter {
  readonly provider: PaymentProvider;
  createPendingPayment(tx: Prisma.TransactionClient, input: CreatePendingPaymentInput): Promise<{
    id: string;
    provider: PaymentProvider;
    status: PaymentStatus;
    amountCents: number;
    currency: string;
  }>;
}

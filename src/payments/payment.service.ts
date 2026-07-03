import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ManualPendingProvider } from './manual-pending.provider';
import type { CreatePendingPaymentInput } from './payment-provider.interface';

@Injectable()
export class PaymentService {
  constructor(private readonly provider: ManualPendingProvider) {}

  createPendingPayment(tx: Prisma.TransactionClient, input: CreatePendingPaymentInput) {
    return this.provider.createPendingPayment(tx, input);
  }
}

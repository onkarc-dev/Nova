import { PaymentStatus } from '@prisma/client';
import type { PrismaService } from '@database/prisma.service';
import type { InventoryReservationService } from '@/inventory/inventory-reservation.service';
import { ManualPendingProvider } from './manual-pending.provider';
import { PaymentService } from './payment.service';
import type { RazorpayProvider } from './razorpay.provider';

describe('PaymentService', () => {
  function createService(paymentStatus: PaymentStatus = PaymentStatus.PENDING) {
    const tx = {
      payment: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'payment_1',
          orderId: 'order_1',
          status: paymentStatus,
          amountCents: 1200,
          currency: 'INR',
        }),
        update: jest.fn().mockResolvedValue({ id: 'payment_1', status: PaymentStatus.CAPTURED }),
      },
      transaction: {
        create: jest.fn().mockResolvedValue({ id: 'txn_1' }),
      },
      order: {
        update: jest.fn().mockResolvedValue({ id: 'order_1' }),
      },
    };
    const prisma = {
      runInTransaction: jest.fn((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
    };
    const razorpayProvider = {
      isConfigured: jest.fn().mockReturnValue(false),
      getPublicKey: jest.fn(),
      verifyWebhookSignature: jest.fn().mockReturnValue(true),
    };
    const inventoryReservationService = {
      deductOrderItems: jest.fn().mockResolvedValue(undefined),
      releaseOrderItems: jest.fn().mockResolvedValue(undefined),
    };
    const service = new PaymentService(
      prisma as unknown as PrismaService,
      new ManualPendingProvider(),
      razorpayProvider as unknown as RazorpayProvider,
      inventoryReservationService as unknown as InventoryReservationService,
    );
    return { inventoryReservationService, service, tx };
  }

  it('deducts reserved inventory when a pending payment is captured', async () => {
    const { inventoryReservationService, service, tx } = createService();

    await service.markPaymentSuccess('payment_1', 'rzp_payment_1');

    expect(tx.payment.update).toHaveBeenCalledWith({
      where: { id: 'payment_1' },
      data: { status: PaymentStatus.CAPTURED, providerRef: 'rzp_payment_1' },
    });
    expect(inventoryReservationService.deductOrderItems).toHaveBeenCalledWith(tx, 'order_1');
  });

  it('treats an already captured payment webhook as idempotent', async () => {
    const { inventoryReservationService, service, tx } = createService(PaymentStatus.CAPTURED);

    await service.markPaymentSuccess('payment_1', 'rzp_payment_1');

    expect(tx.payment.update).not.toHaveBeenCalled();
    expect(inventoryReservationService.deductOrderItems).not.toHaveBeenCalled();
  });
});

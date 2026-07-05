import { BadRequestException } from '@nestjs/common';
import { PaymentProvider, PaymentStatus, RefundStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import type { PrismaService } from '@database/prisma.service';
import type { InventoryReservationService } from '@/inventory/inventory-reservation.service';
import type { NotificationsService } from '@/notifications/notifications.service';
import type { ShipmentsService } from '@/shipments/shipments.service';
import { ManualPendingProvider } from './manual-pending.provider';
import { PaymentService } from './payment.service';
import type { RazorpayProvider } from './razorpay.provider';

describe('PaymentService', () => {
  function createService(paymentStatus: PaymentStatus = PaymentStatus.CREATED) {
    const payment = {
      id: 'payment_1',
      orderId: 'order_1',
      provider: PaymentProvider.RAZORPAY,
      status: paymentStatus,
      amountCents: 1200,
      currency: 'INR',
      providerRef: 'order_rzp_1',
      providerOrderId: 'order_rzp_1',
      providerPaymentId: null,
      refundedCents: 0,
    };
    const tx = {
      payment: {
        findUnique: jest.fn().mockResolvedValue(payment),
        findFirst: jest.fn().mockResolvedValue(payment),
        findMany: jest.fn().mockResolvedValue([payment]),
        create: jest.fn().mockResolvedValue({ ...payment, provider: PaymentProvider.MANUAL_DEV }),
        update: jest.fn().mockResolvedValue({ ...payment, status: PaymentStatus.CAPTURED }),
      },
      transaction: {
        create: jest.fn().mockResolvedValue({ id: 'txn_1' }),
      },
      order: {
        findUnique: jest.fn().mockResolvedValue({ id: 'order_1', orderNumber: 'NOVA-1', userId: 'user_1', items: [] }),
        update: jest.fn().mockResolvedValue({ id: 'order_1' }),
      },
      seller: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      user: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      refund: {
        create: jest.fn().mockResolvedValue({ id: 'refund_1', status: RefundStatus.REQUESTED }),
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({ id: 'refund_1', status: RefundStatus.PROCESSED }),
      },
      paymentAuditEvent: {
        create: jest.fn().mockResolvedValue({ id: 'audit_1' }),
      },
      webhookEvent: {
        create: jest.fn().mockResolvedValue({ id: 'webhook_1' }),
        update: jest.fn().mockResolvedValue({ id: 'webhook_1' }),
      },
    };
    const prisma = {
      runInTransaction: jest.fn((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
      payment: {
        findUnique: jest.fn().mockResolvedValue(payment),
        findFirst: jest.fn().mockResolvedValue(payment),
        findMany: jest.fn().mockResolvedValue([payment]),
      },
      refund: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      paymentAuditEvent: {
        create: jest.fn().mockResolvedValue({ id: 'audit_root' }),
      },
    };
    const razorpayProvider = {
      isConfigured: jest.fn().mockReturnValue(false),
      getPublicKey: jest.fn().mockReturnValue(undefined),
      verifyPayment: jest.fn().mockResolvedValue({ verified: true, providerPaymentId: 'pay_rzp_1', rawResponse: { ok: true } }),
      verifyWebhookSignature: jest.fn().mockReturnValue(true),
      refundPayment: jest.fn().mockResolvedValue({ providerRef: 'refund_rzp_1', status: PaymentStatus.REFUNDED, rawResponse: { id: 'refund_rzp_1' } }),
    };
    const inventoryReservationService = {
      deductOrderItems: jest.fn().mockResolvedValue(undefined),
      releaseOrderItems: jest.fn().mockResolvedValue(undefined),
    };
    const shipmentsService = { createShipmentPlaceholders: jest.fn().mockResolvedValue([]) };
    const notificationsService = { createFromEventTx: jest.fn().mockResolvedValue([]) };
    const financeService = { createCommissionsForPaymentTx: jest.fn().mockResolvedValue({ created: 1, skipped: false }) };
    const service = new PaymentService(
      prisma as unknown as PrismaService,
      new ManualPendingProvider(),
      razorpayProvider as unknown as RazorpayProvider,
      inventoryReservationService as unknown as InventoryReservationService,
      shipmentsService as unknown as ShipmentsService,
      notificationsService as unknown as NotificationsService,
      financeService as unknown as ConstructorParameters<typeof PaymentService>[6],
    );
    return { financeService, inventoryReservationService, payment, prisma, razorpayProvider, service, tx };
  }

  it('uses the manual provider fallback when Razorpay is not configured', async () => {
    const { service, tx } = createService();

    await service.createPendingPayment(tx as unknown as Prisma.TransactionClient, {
      orderId: 'order_1',
      amountCents: 1200,
      currency: 'INR',
    });

    expect(tx.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ provider: PaymentProvider.MANUAL_DEV, status: PaymentStatus.CREATED }),
      }),
    );
    expect(tx.paymentAuditEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: 'CREATED' }) }));
  });

  it('verifies a Razorpay signature before capturing payment', async () => {
    const { inventoryReservationService, razorpayProvider, service } = createService();

    await service.verify({
      paymentId: 'payment_1',
      providerOrderId: 'order_rzp_1',
      providerPaymentId: 'pay_rzp_1',
      signature: 'sig_1',
    });

    expect(razorpayProvider.verifyPayment).toHaveBeenCalledWith({
      providerOrderId: 'order_rzp_1',
      providerPaymentId: 'pay_rzp_1',
      signature: 'sig_1',
    });
    expect(inventoryReservationService.deductOrderItems).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid frontend payment verification', async () => {
    const { razorpayProvider, service } = createService();
    razorpayProvider.verifyPayment.mockResolvedValueOnce({ verified: false, providerPaymentId: 'pay_rzp_1' });

    await expect(
      service.verify({
        paymentId: 'payment_1',
        providerOrderId: 'order_rzp_1',
        providerPaymentId: 'pay_rzp_1',
        signature: 'bad',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('treats a duplicate captured webhook as idempotent', async () => {
    const { inventoryReservationService, service, tx } = createService(PaymentStatus.CAPTURED);

    await service.markPaymentSuccess('payment_1', 'pay_rzp_1');

    expect(tx.payment.update).not.toHaveBeenCalled();
    expect(inventoryReservationService.deductOrderItems).not.toHaveBeenCalled();
  });

  it('releases inventory once when payment fails', async () => {
    const { inventoryReservationService, service } = createService();

    await service.markPaymentFailed('payment_1', 'pay_rzp_1');

    expect(inventoryReservationService.releaseOrderItems).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid Razorpay webhook signatures', async () => {
    const { razorpayProvider, service } = createService();
    razorpayProvider.verifyWebhookSignature.mockReturnValueOnce(false);

    await expect(service.handleRazorpayWebhook('{}', 'bad', { event: 'payment.captured' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('releases inventory once when pending payments expire', async () => {
    const { inventoryReservationService, prisma, service } = createService();
    prisma.payment.findMany.mockResolvedValueOnce([{ id: 'payment_1' }]);

    await service.expirePendingPayments(10);

    expect(inventoryReservationService.releaseOrderItems).toHaveBeenCalledTimes(1);
  });

  it('creates a full refund for admin users', async () => {
    const { razorpayProvider, service, tx } = createService(PaymentStatus.CAPTURED);

    await service.refund({ id: 'admin_1', email: 'admin@nova.test', roles: ['admin'] }, 'payment_1', {
      amountCents: 1200,
      reason: 'Customer request',
    });

    expect(razorpayProvider.refundPayment).toHaveBeenCalledWith(expect.objectContaining({ amountCents: 1200 }));
    expect(tx.payment.update).toHaveBeenCalledWith({ where: { id: 'payment_1' }, data: { status: PaymentStatus.REFUNDED, refundedCents: 1200 } });
  });

  it('blocks non-admin refund requests', async () => {
    const { service } = createService(PaymentStatus.CAPTURED);

    await expect(
      service.refund({ id: 'user_1', email: 'buyer@nova.test', roles: ['customer'] }, 'payment_1', { amountCents: 100 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

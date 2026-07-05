import { CommissionStatus, PaymentEventType, PaymentStatus, Prisma } from '@prisma/client';
import { FinanceService } from './finance.service';

interface TransactionMock {
  payment: { findUnique: jest.Mock<Promise<unknown>, [unknown]> };
  return: { findUnique: jest.Mock<Promise<unknown>, [unknown]> };
  commissionRecord: {
    upsert: jest.Mock<Promise<unknown>, [unknown]>;
    updateMany: jest.Mock<Promise<unknown>, [unknown]>;
    findMany: jest.Mock<Promise<unknown>, [unknown]>;
  };
}

interface PrismaMock {
  runInTransaction: jest.Mock<Promise<unknown>, [callback: (client: TransactionMock) => Promise<unknown>]>;
  return: { findUnique: jest.Mock<Promise<unknown>, [unknown]> };
  commissionRecord: {
    updateMany: jest.Mock<Promise<unknown>, [unknown]>;
    findMany: jest.Mock<Promise<unknown>, [unknown]>;
  };
  sellerSettlement: {
    upsert: jest.Mock<Promise<unknown>, [unknown]>;
    aggregate: jest.Mock<Promise<unknown>, [unknown]>;
  };
}

describe('FinanceService', () => {
  const configService = { get: jest.fn(() => 1000) };
  const notificationsService = { createFromEvent: jest.fn() };
  const tx: TransactionMock = {
    payment: { findUnique: jest.fn<Promise<unknown>, [unknown]>() },
    return: { findUnique: jest.fn<Promise<unknown>, [unknown]>() },
    commissionRecord: {
      upsert: jest.fn<Promise<unknown>, [unknown]>(),
      updateMany: jest.fn<Promise<unknown>, [unknown]>(),
      findMany: jest.fn<Promise<unknown>, [unknown]>(),
    },
  };
  const prisma: PrismaMock = {
    runInTransaction: jest.fn<Promise<unknown>, [callback: (client: TransactionMock) => Promise<unknown>]>((callback) =>
      callback(tx),
    ),
    return: { findUnique: jest.fn<Promise<unknown>, [unknown]>() },
    commissionRecord: {
      updateMany: jest.fn<Promise<unknown>, [unknown]>(),
      findMany: jest.fn<Promise<unknown>, [unknown]>(),
    },
    sellerSettlement: {
      upsert: jest.fn<Promise<unknown>, [unknown]>(),
      aggregate: jest.fn<Promise<unknown>, [unknown]>(),
    },
  };

  let service: FinanceService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FinanceService(
      prisma as unknown as ConstructorParameters<typeof FinanceService>[0],
      configService as unknown as ConstructorParameters<typeof FinanceService>[1],
      notificationsService as unknown as ConstructorParameters<typeof FinanceService>[2],
    );
  });

  it('creates idempotent commission records from captured payments using default BPS when seller rate is absent', async () => {
    tx.payment.findUnique.mockResolvedValue({
      id: 'pay_1',
      currency: 'INR',
      order: {
        items: [
          {
            id: 'item_1',
            sellerId: 'seller_1',
            storeId: 'store_1',
            orderId: 'order_1',
            totalCents: 10_000,
            commissionRateSnapshot: new Prisma.Decimal(0),
            seller: { userId: 'user_1' },
          },
        ],
      },
    });
    tx.commissionRecord.upsert.mockResolvedValue({ createdAt: new Date('2026-07-01'), updatedAt: new Date('2026-07-01') });

    await expect(
      service.createCommissionsForPayment({
        paymentId: 'pay_1',
        orderId: 'order_1',
        eventType: PaymentEventType.CAPTURED,
        status: PaymentStatus.CAPTURED,
      }),
    ).resolves.toEqual({ created: 1, skipped: false });

    const upsertCall = tx.commissionRecord.upsert.mock.calls[0]?.[0] as {
      create?: { grossAmountCents: number; commissionRateBps: number; commissionAmountCents: number; netAmountCents: number };
      update?: Record<string, never>;
      where?: { orderItemId_paymentId: { orderItemId: string; paymentId: string } };
    };
    expect(upsertCall.where).toEqual({ orderItemId_paymentId: { orderItemId: 'item_1', paymentId: 'pay_1' } });
    expect(upsertCall.create).toEqual(
      expect.objectContaining({
        grossAmountCents: 10_000,
        commissionRateBps: 1000,
        commissionAmountCents: 1000,
        netAmountCents: 9000,
      }),
    );
    expect(upsertCall.update).toEqual({});
  });

  it('reverses pending commissions when a return references seller order items', async () => {
    tx.return.findUnique.mockResolvedValue({
      id: 'return_1',
      orderId: 'order_1',
      order: { items: [{ id: 'item_1' }] },
    });
    tx.commissionRecord.updateMany.mockResolvedValue({ count: 1 });
    tx.commissionRecord.findMany.mockResolvedValue([{ id: 'commission_1', seller: { userId: 'seller_user_1' } }]);

    await expect(service.reverseCommissionsForReturn('return_1')).resolves.toEqual({ count: 1 });

    expect(tx.commissionRecord.updateMany).toHaveBeenCalledWith({
      where: {
        orderId: 'order_1',
        orderItemId: { in: ['item_1'] },
        status: { in: [CommissionStatus.PENDING, CommissionStatus.LOCKED] },
      },
      data: { status: CommissionStatus.REVERSED, metadata: { reversedByReturnId: 'return_1' } },
    });
    expect(notificationsService.createFromEvent).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'seller_user_1', metadata: { commissionId: 'commission_1', returnId: 'return_1' } }),
    );
  });

  it('generates one idempotent settlement per seller store period group', async () => {
    prisma.commissionRecord.findMany.mockResolvedValue([
      {
        id: 'commission_1',
        sellerId: 'seller_1',
        storeId: 'store_1',
        grossAmountCents: 10_000,
        commissionAmountCents: 1000,
        netAmountCents: 9000,
        currency: 'INR',
        seller: { userId: 'seller_user_1' },
        store: {},
      },
      {
        id: 'commission_2',
        sellerId: 'seller_1',
        storeId: 'store_1',
        grossAmountCents: 5000,
        commissionAmountCents: 500,
        netAmountCents: 4500,
        currency: 'INR',
        seller: { userId: 'seller_user_1' },
        store: {},
      },
    ]);
    prisma.sellerSettlement.upsert.mockResolvedValue({ id: 'settlement_1' });
    prisma.commissionRecord.updateMany.mockResolvedValue({ count: 2 });

    await expect(service.generateSettlements({ periodStart: '2026-07-01', periodEnd: '2026-08-01' })).resolves.toEqual([
      { id: 'settlement_1' },
    ]);

    const settlementCall = prisma.sellerSettlement.upsert.mock.calls[0]?.[0] as {
      create?: { grossAmountCents: number; commissionAmountCents: number; netPayoutCents: number };
      update?: Record<string, never>;
    };
    expect(settlementCall.create).toEqual(
      expect.objectContaining({
        grossAmountCents: 15_000,
        commissionAmountCents: 1500,
        netPayoutCents: 13_500,
      }),
    );
    expect(settlementCall.update).toEqual({});
    expect(prisma.commissionRecord.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['commission_1', 'commission_2'] }, settlementId: null },
        data: { settlementId: 'settlement_1', status: CommissionStatus.LOCKED },
      }),
    );
  });
});

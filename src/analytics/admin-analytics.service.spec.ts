import { AdminAnalyticsService } from './admin-analytics.service';
import { AnalyticsAggregationService } from './analytics-aggregation.service';

function buildPrismaMock() {
  return {
    order: {
      aggregate: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    commissionRecord: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    payment: {
      count: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    return: {
      groupBy: jest.fn(),
      count: jest.fn(),
    },
    refund: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    seller: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    product: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    shipment: {
      groupBy: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    orderItem: {
      groupBy: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    inventory: {
      findMany: jest.fn(),
    },
    sellerSettlement: {
      findMany: jest.fn(),
    },
  };
}

type PrismaMock = ReturnType<typeof buildPrismaMock>;

describe('AdminAnalyticsService', () => {
  let prisma: PrismaMock;
  let service: AdminAnalyticsService;

  beforeEach(() => {
    prisma = buildPrismaMock();
    // Sensible defaults so overview() doesn't throw when a field isn't the focus of a test.
    prisma.order.aggregate.mockResolvedValue({ _sum: { totalCents: 0 } });
    prisma.commissionRecord.aggregate.mockResolvedValue({ _sum: { commissionAmountCents: 0 } });
    prisma.order.count.mockResolvedValue(0);
    prisma.payment.count.mockResolvedValue(0);
    prisma.return.groupBy.mockResolvedValue([]);
    prisma.return.count.mockResolvedValue(0);
    prisma.refund.count.mockResolvedValue(0);
    prisma.refund.aggregate.mockResolvedValue({ _sum: { amountCents: 0 } });
    prisma.seller.count.mockResolvedValue(0);
    prisma.product.count.mockResolvedValue(0);
    prisma.shipment.groupBy.mockResolvedValue([]);
    prisma.shipment.findMany.mockResolvedValue([]);
    prisma.shipment.count.mockResolvedValue(0);
    prisma.orderItem.groupBy.mockResolvedValue([]);
    prisma.orderItem.findMany.mockResolvedValue([]);
    prisma.product.findMany.mockResolvedValue([]);
    prisma.inventory.findMany.mockResolvedValue([]);
    prisma.seller.findMany.mockResolvedValue([]);

    service = new AdminAnalyticsService(
      prisma as unknown as ConstructorParameters<typeof AdminAnalyticsService>[0],
      new AnalyticsAggregationService(),
    );
  });

  describe('overview', () => {
    it('computes GMV, net revenue, commission revenue and refund deduction correctly', async () => {
      prisma.order.aggregate.mockResolvedValue({ _sum: { totalCents: 100_000 } });
      prisma.commissionRecord.aggregate.mockResolvedValue({ _sum: { commissionAmountCents: 10_000 } });
      prisma.refund.aggregate.mockResolvedValue({ _sum: { amountCents: 5_000 } });
      prisma.order.count.mockResolvedValue(20);

      const result = await service.overview({ from: '2026-06-01', to: '2026-06-30' });

      expect(result.gmvCents).toBe(100_000);
      expect(result.commissionRevenueCents).toBe(10_000);
      expect(result.refundAmountCents).toBe(5_000);
      expect(result.netRevenueCents).toBe(95_000);
      expect(result.averageOrderValueCents).toBe(5_000);
    });

    it('computes payment success rate from captured vs total payments', async () => {
      prisma.payment.count.mockImplementation((args: { where?: { status?: unknown } }) => {
        if (args.where?.status) return Promise.resolve(75);
        return Promise.resolve(100);
      });

      const result = await service.overview({});
      expect(result.paymentSuccessRatePercent).toBe(75);
      expect(result.paidOrders).toBe(75);
    });

    it('reports shipment status breakdown from groupBy results', async () => {
      prisma.shipment.groupBy.mockResolvedValue([
        { status: 'DELIVERED', _count: { _all: 12 } },
        { status: 'IN_TRANSIT', _count: { _all: 3 } },
      ]);

      const result = await service.overview({});
      expect(result.shipmentStatusBreakdown).toEqual({ DELIVERED: 12, IN_TRANSIT: 3 });
    });

    it('returns zero rates safely when there are no orders in the period (no division by zero)', async () => {
      const result = await service.overview({});
      expect(result.averageOrderValueCents).toBe(0);
      expect(result.paymentSuccessRatePercent).toBe(0);
      expect(result.returnRatePercent).toBe(0);
    });
  });

  describe('products', () => {
    it('returns top products by revenue and by quantity with resolved names', async () => {
      prisma.orderItem.groupBy.mockImplementation((args: { orderBy?: { _sum?: { totalCents?: string; quantity?: string } } }) => {
        if (args.orderBy?._sum?.quantity) {
          return Promise.resolve([{ productId: 'p2', _sum: { totalCents: 200, quantity: 50 } }]);
        }
        return Promise.resolve([{ productId: 'p1', _sum: { totalCents: 900, quantity: 5 } }]);
      });
      prisma.product.findMany.mockResolvedValue([
        { id: 'p1', name: 'Best Seller' },
        { id: 'p2', name: 'Bulk Item' },
      ]);

      const result = await service.products({ limit: 5 });
      expect(result.topByRevenue).toEqual([{ id: 'p1', label: 'Best Seller', revenueCents: 900, quantity: 5 }]);
      expect(result.topByQuantity).toEqual([{ id: 'p2', label: 'Bulk Item', revenueCents: 200, quantity: 50 }]);
      expect(result.conversionRatePercent).toBeNull();
    });
  });

  describe('sellers', () => {
    it('ranks sellers by gross sales and resolves their business names', async () => {
      prisma.commissionRecord.groupBy.mockResolvedValue([
        { sellerId: 's1', _sum: { grossAmountCents: 5000, commissionAmountCents: 500, netAmountCents: 4500 }, _count: { _all: 3 } },
      ]);
      prisma.seller.findMany.mockResolvedValue([{ id: 's1', businessName: 'Acme Traders' }]);

      const result = await service.sellers({});
      expect(result.topSellers).toEqual([
        { sellerId: 's1', businessName: 'Acme Traders', grossSalesCents: 5000, commissionCents: 500, netEarningsCents: 4500, orderItemCount: 3 },
      ]);
    });
  });

  describe('categories', () => {
    it('aggregates category and brand revenue from projected order items', async () => {
      prisma.orderItem.findMany.mockResolvedValue([
        {
          totalCents: 1000,
          quantity: 2,
          product: { category: { id: 'cat1', name: 'Electronics' }, brand: { id: 'b1', name: 'Acme' } },
        },
        {
          totalCents: 500,
          quantity: 1,
          product: { category: { id: 'cat1', name: 'Electronics' }, brand: { id: 'b2', name: 'Globex' } },
        },
      ]);

      const result = await service.categories({});
      expect(result.topCategories).toEqual([{ id: 'cat1', label: 'Electronics', revenueCents: 1500, quantity: 3 }]);
      expect(result.topBrands).toEqual(
        expect.arrayContaining([
          { id: 'b1', label: 'Acme', revenueCents: 1000, quantity: 2 },
          { id: 'b2', label: 'Globex', revenueCents: 500, quantity: 1 },
        ]),
      );
    });
  });

  describe('exportCsv', () => {
    it('produces a correct CSV header and rows for a products export', async () => {
      prisma.orderItem.groupBy.mockResolvedValue([{ productId: 'p1', _sum: { totalCents: 900, quantity: 5 } }]);
      prisma.product.findMany.mockResolvedValue([{ id: 'p1', name: 'Best Seller' }]);

      const { csv, filename } = await service.exportCsv({ type: 'products', from: '2026-06-01', to: '2026-06-30' });
      const lines = csv.split('\n');
      expect(lines[0]).toBe('id,label,revenueCents,quantity');
      expect(lines[1]).toBe('p1,Best Seller,900,5');
      expect(filename).toMatch(/^admin-products-.*\.csv$/);
    });
  });
});

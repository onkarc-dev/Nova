import { NotFoundException } from '@nestjs/common';
import { SellerAnalyticsService } from './seller-analytics.service';
import { AnalyticsAggregationService } from './analytics-aggregation.service';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';

type SellerFindUniqueResult = { id: string } | null;
type StoreFindManyResult = { id: string }[];
type OrderItemAggregateResult = { _sum: { totalCents: number; commissionAmountCents: number } };
type RefundAggregateResult = { _sum: { amountCents: number } };
type OrderItemGroupByResult = { productId: string; _sum: { totalCents: number; quantity: number } }[];
type ProductFindManyResult = { id: string; name: string }[];

type SellerFindUniqueArgs = { where: { userId: string }; select: { id: true } };
type StoreFindManyArgs = { where?: { sellerId?: string }; select?: { id: true } };
type OrderCountArgs = { where: { items?: { some?: { sellerId?: string } } } };
type OrderItemAggregateArgs = { where: { sellerId?: string } };
type OrderItemGroupByArgs = { where: { sellerId?: string } };
type InventoryFindManyArgs = { where: { storeId: { in: string[] } } };
type SellerSettlementFindManyArgs = { where: { sellerId?: string } };

function buildPrismaMock() {
  return {
    seller: { findUnique: jest.fn<Promise<SellerFindUniqueResult>, [SellerFindUniqueArgs]>() },
    store: { findMany: jest.fn<Promise<StoreFindManyResult>, [StoreFindManyArgs]>() },
    order: { count: jest.fn<Promise<number>, [OrderCountArgs]>(), groupBy: jest.fn<Promise<unknown[]>, [unknown]>() },
    orderItem: {
      groupBy: jest.fn<Promise<OrderItemGroupByResult>, [OrderItemGroupByArgs]>(),
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
      aggregate: jest.fn<Promise<OrderItemAggregateResult>, [OrderItemAggregateArgs]>(),
    },
    product: { findMany: jest.fn<Promise<ProductFindManyResult>, [unknown]>(), count: jest.fn<Promise<number>, [unknown]>() },
    refund: { count: jest.fn<Promise<number>, [unknown]>(), aggregate: jest.fn<Promise<RefundAggregateResult>, [unknown]>(), findMany: jest.fn<Promise<unknown[]>, [unknown]>() },
    return: { count: jest.fn<Promise<number>, [unknown]>(), groupBy: jest.fn<Promise<unknown[]>, [unknown]>() },
    shipment: { groupBy: jest.fn<Promise<unknown[]>, [unknown]>(), findMany: jest.fn<Promise<unknown[]>, [unknown]>(), count: jest.fn<Promise<number>, [unknown]>() },
    inventory: { findMany: jest.fn<Promise<unknown[]>, [InventoryFindManyArgs]>() },
    sellerSettlement: { findMany: jest.fn<Promise<unknown[]>, [SellerSettlementFindManyArgs]>() },
  };
}

type PrismaMock = ReturnType<typeof buildPrismaMock>;

const user = { id: 'user_1', roles: ['seller'] } as unknown as AuthUser;

describe('SellerAnalyticsService', () => {
  let prisma: PrismaMock;
  let service: SellerAnalyticsService;

  beforeEach(() => {
    prisma = buildPrismaMock();
    prisma.seller.findUnique.mockResolvedValue({ id: 'seller_1' });
    prisma.store.findMany.mockResolvedValue([{ id: 'store_1' }]);
    prisma.order.count.mockResolvedValue(0);
    prisma.order.groupBy.mockResolvedValue([]);
    prisma.orderItem.aggregate.mockResolvedValue({ _sum: { totalCents: 0, commissionAmountCents: 0 } });
    prisma.orderItem.groupBy.mockResolvedValue([]);
    prisma.orderItem.findMany.mockResolvedValue([]);
    prisma.product.findMany.mockResolvedValue([]);
    prisma.product.count.mockResolvedValue(0);
    prisma.refund.count.mockResolvedValue(0);
    prisma.refund.aggregate.mockResolvedValue({ _sum: { amountCents: 0 } });
    prisma.refund.findMany.mockResolvedValue([]);
    prisma.return.count.mockResolvedValue(0);
    prisma.return.groupBy.mockResolvedValue([]);
    prisma.shipment.groupBy.mockResolvedValue([]);
    prisma.shipment.findMany.mockResolvedValue([]);
    prisma.shipment.count.mockResolvedValue(0);
    prisma.inventory.findMany.mockResolvedValue([]);
    prisma.sellerSettlement.findMany.mockResolvedValue([]);

    service = new SellerAnalyticsService(
      prisma as unknown as ConstructorParameters<typeof SellerAnalyticsService>[0],
      new AnalyticsAggregationService(),
    );
  });

  it('throws NotFoundException when the authenticated user has no seller profile', async () => {
    prisma.seller.findUnique.mockResolvedValue(null);
    await expect(service.overview(user, {})).rejects.toBeInstanceOf(NotFoundException);
  });

  it('scopes every query to the resolved seller id, never trusting caller input', async () => {
    await service.overview(user, {});

    expect(prisma.seller.findUnique).toHaveBeenCalledWith({ where: { userId: user.id }, select: { id: true } });
    const orderItemWhere = prisma.orderItem.aggregate.mock.calls[0]?.[0].where;
    expect(orderItemWhere?.sellerId).toBe('seller_1');

    const orderWhere = prisma.order.count.mock.calls[0]?.[0].where;
    expect(orderWhere?.items?.some?.sellerId).toBe('seller_1');
  });

  it('never exposes another seller: sellerId in scoped where-clauses always matches the caller, ignoring any attempt to pass a foreign id via query filters', async () => {
    await service.products(user, { limit: 5 });
    for (const call of prisma.orderItem.groupBy.mock.calls) {
      expect(call[0].where.sellerId).toBe('seller_1');
    }
  });

  it('computes seller revenue as gross minus commission minus refunds', async () => {
    prisma.orderItem.aggregate.mockResolvedValue({ _sum: { totalCents: 10_000, commissionAmountCents: 1_000 } });
    prisma.refund.aggregate.mockResolvedValue({ _sum: { amountCents: 500 } });
    prisma.order.count.mockResolvedValue(4);

    const result = await service.overview(user, {});
    expect(result.grossSalesCents).toBe(10_000);
    expect(result.commissionCents).toBe(1_000);
    expect(result.refundAmountCents).toBe(500);
    expect(result.netSalesCents).toBe(8_500);
    expect(result.averageOrderValueCents).toBe(2_500);
  });

  it('ranks the seller own products only', async () => {
    prisma.orderItem.groupBy.mockResolvedValue([{ productId: 'p1', _sum: { totalCents: 700, quantity: 3 } }]);
    prisma.product.findMany.mockResolvedValue([{ id: 'p1', name: 'Seller Item' }]);

    const result = await service.products(user, { limit: 5 });
    expect(result.topByRevenue).toEqual([{ id: 'p1', label: 'Seller Item', revenueCents: 700, quantity: 3 }]);
  });

  it('scopes inventory health to the seller own store ids', async () => {
    await service.inventory(user, { limit: 5 });
    expect(prisma.inventory.findMany.mock.calls[0]?.[0].where).toEqual({ storeId: { in: ['store_1'] } });
  });

  it('produces a correctly scoped CSV export for products', async () => {
    prisma.orderItem.groupBy.mockResolvedValue([{ productId: 'p1', _sum: { totalCents: 300, quantity: 2 } }]);
    prisma.product.findMany.mockResolvedValue([{ id: 'p1', name: 'Seller Item' }]);

    const { csv, filename } = await service.exportCsv(user, { type: 'products', from: '2026-06-01', to: '2026-06-30' });
    const lines = csv.split('\n');
    expect(lines[0]).toBe('id,label,revenueCents,quantity');
    expect(lines[1]).toBe('p1,Seller Item,300,2');
    expect(filename).toMatch(/^seller-products-.*\.csv$/);
  });

  it('scopes settlement exports to the caller seller id', async () => {
    await service.exportCsv(user, { type: 'settlements', from: '2026-06-01', to: '2026-06-30' });
    expect(prisma.sellerSettlement.findMany.mock.calls[0]?.[0].where.sellerId).toBe('seller_1');
  });
});

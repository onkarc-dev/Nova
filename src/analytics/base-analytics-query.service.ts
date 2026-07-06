import { RefundStatus, ShipmentStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import type { PrismaService } from '@database/prisma.service';
import type { AnalyticsAggregationService } from './analytics-aggregation.service';
import type { AnalyticsGranularity } from './dto/analytics-query.dto';
import type { ResolvedPeriod, RevenueTimeBucket, TopEntry } from './interfaces/analytics.interfaces';

export interface RevenueSeriesParams {
  period: ResolvedPeriod;
  granularity: AnalyticsGranularity;
  orderItemWhere: Prisma.OrderItemWhereInput;
  refundWhere: Prisma.RefundWhereInput;
}

export interface RevenueSeriesResult {
  buckets: RevenueTimeBucket[];
  summary: {
    grossSalesCents: number;
    netSalesCents: number;
    commissionCents: number;
    refundCents: number;
    orderCount: number;
    itemQuantity: number;
  };
}

export interface ShipmentBreakdown {
  byStatus: Record<string, number>;
  averageDeliveryHours: number | null;
  delayedCount: number;
}

export interface ReturnRefundStats {
  returnCount: number;
  refundCount: number;
  refundAmountCents: number;
  returnRatePercent: number;
  refundRatePercent: number;
  topReturnReasons: { reason: string; count: number }[];
}

export interface InventoryHealth {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  reservedTotal: number;
  sellableTotal: number;
  inventoryValueCentsEstimate: number;
  lowStockProducts: { productId: string; name: string; sellable: number; safetyStock: number }[];
}

/**
 * Shared query building blocks for analytics. Both {@link AdminAnalyticsService} (unscoped)
 * and {@link SellerAnalyticsService} (scoped to one seller) extend this so the actual Prisma
 * queries — the part that's easy to get subtly wrong — are written exactly once.
 *
 * Analytics here are computed live from operational tables (Order/OrderItem/Payment/Refund/
 * Shipment/CommissionRecord/Inventory) rather than from a pre-aggregated warehouse. That is a
 * deliberate MVP tradeoff: no new snapshot table/migration, always-fresh numbers, bounded query
 * cost via the `from`/`to` window. See docs/cadde-store-mvp.md for the future rollup path.
 */
export abstract class BaseAnalyticsQueryService {
  protected constructor(
    protected readonly prisma: PrismaService,
    protected readonly aggregation: AnalyticsAggregationService,
  ) {}

  protected async buildRevenueSeries(params: RevenueSeriesParams): Promise<RevenueSeriesResult> {
    const { period, granularity, orderItemWhere, refundWhere } = params;
    const buckets = this.aggregation.buildEmptyBuckets(period, granularity);
    const alignedFrom = this.aggregation.alignToBucketStart(period.from, granularity);

    const [orderItems, refunds] = await Promise.all([
      this.prisma.orderItem.findMany({
        where: orderItemWhere,
        select: { totalCents: true, commissionAmountCents: true, quantity: true, orderId: true, order: { select: { placedAt: true } } },
      }),
      this.prisma.refund.findMany({
        where: refundWhere,
        select: { amountCents: true, createdAt: true },
      }),
    ]);

    for (const item of orderItems) {
      this.aggregation.addOrderItemSample(buckets, alignedFrom, granularity, item.order.placedAt, {
        grossCents: item.totalCents,
        commissionCents: item.commissionAmountCents,
        quantity: item.quantity,
        orderId: item.orderId,
      });
    }
    for (const refund of refunds) {
      this.aggregation.addRefundSample(buckets, alignedFrom, granularity, refund.createdAt, refund.amountCents);
    }

    const finalized = this.aggregation.finalizeBuckets(buckets);
    const summary = finalized.reduce(
      (acc, bucket) => ({
        grossSalesCents: acc.grossSalesCents + bucket.grossSalesCents,
        netSalesCents: acc.netSalesCents + bucket.netSalesCents,
        commissionCents: acc.commissionCents + bucket.commissionCents,
        refundCents: acc.refundCents + bucket.refundCents,
        orderCount: acc.orderCount + bucket.orderCount,
        itemQuantity: acc.itemQuantity + bucket.itemQuantity,
      }),
      { grossSalesCents: 0, netSalesCents: 0, commissionCents: 0, refundCents: 0, orderCount: 0, itemQuantity: 0 },
    );

    return { buckets: finalized, summary };
  }

  protected async orderStatusBreakdown(where: Prisma.OrderWhereInput): Promise<Record<string, number>> {
    const rows = await this.prisma.order.groupBy({ by: ['status'], where, _count: { _all: true } });
    return Object.fromEntries(rows.map((row) => [row.status, row._count._all]));
  }

  protected async shipmentStatusBreakdown(where: Prisma.ShipmentWhereInput): Promise<ShipmentBreakdown> {
    const now = new Date();
    const [statusRows, delivered, delayedCount]: [
      { status: string; _count: { _all: number } }[],
      { shippedAt: Date | null; deliveredAt: Date | null }[],
      number,
    ] = await Promise.all([
      this.prisma.shipment.groupBy({ by: ['status'], where, _count: { _all: true } }),
      this.prisma.shipment.findMany({
        where: { ...where, deliveredAt: { not: null }, shippedAt: { not: null } },
        select: { shippedAt: true, deliveredAt: true },
        take: 5000,
      }),
      this.prisma.shipment.count({
        where: {
          ...where,
          estimatedDeliveryAt: { not: null, lt: now },
          status: { notIn: [ShipmentStatus.DELIVERED, ShipmentStatus.CANCELLED, ShipmentStatus.FAILED_DELIVERY] },
        },
      }),
    ]);

    const byStatus = Object.fromEntries(statusRows.map((row) => [row.status, row._count._all]));
    let averageDeliveryHours: number | null = null;
    const completedDeliveries = delivered.filter(
      (row): row is { shippedAt: Date; deliveredAt: Date } => row.shippedAt !== null && row.deliveredAt !== null,
    );
    if (completedDeliveries.length > 0) {
      const totalHours = completedDeliveries.reduce((sum, row) => {
        return sum + (row.deliveredAt.getTime() - row.shippedAt.getTime()) / (60 * 60 * 1000);
      }, 0);
      averageDeliveryHours = Number((totalHours / completedDeliveries.length).toFixed(2));
    }

    return { byStatus, averageDeliveryHours, delayedCount };
  }

  protected async returnRefundStats(
    returnWhere: Prisma.ReturnWhereInput,
    refundWhere: Prisma.RefundWhereInput,
    totalOrdersInPeriod: number,
  ): Promise<ReturnRefundStats> {
    const [returnCount, refundTotal, refundProcessed, reasonRows] = await Promise.all([
      this.prisma.return.count({ where: returnWhere }),
      this.prisma.refund.count({ where: refundWhere }),
      this.prisma.refund.aggregate({ where: { ...refundWhere, status: RefundStatus.PROCESSED }, _sum: { amountCents: true } }),
      this.prisma.return.groupBy({ by: ['reason'], where: returnWhere, _count: { _all: true }, orderBy: { _count: { reason: 'desc' } }, take: 5 }),
    ]);

    return {
      returnCount,
      refundCount: refundTotal,
      refundAmountCents: refundProcessed._sum.amountCents ?? 0,
      returnRatePercent: totalOrdersInPeriod > 0 ? Number(((returnCount / totalOrdersInPeriod) * 100).toFixed(2)) : 0,
      refundRatePercent: totalOrdersInPeriod > 0 ? Number(((refundTotal / totalOrdersInPeriod) * 100).toFixed(2)) : 0,
      // Return.reason is free text (not a structured enum), so this is a coarse, exact-string
      // grouping rather than a true reason taxonomy. Documented limitation — see docs.
      topReturnReasons: reasonRows.map((row) => ({ reason: row.reason, count: row._count._all })),
    };
  }

  protected async topProducts(where: Prisma.OrderItemWhereInput, limit: number): Promise<TopEntry[]> {
    const rows = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where,
      _sum: { totalCents: true, quantity: true },
      orderBy: { _sum: { totalCents: 'desc' } },
      take: limit,
    });
    if (rows.length === 0) return [];
    const products = await this.prisma.product.findMany({
      where: { id: { in: rows.map((row) => row.productId) } },
      select: { id: true, name: true },
    });
    const nameById = new Map(products.map((product) => [product.id, product.name]));
    return rows.map((row) => ({
      id: row.productId,
      label: nameById.get(row.productId) ?? 'Unknown product',
      revenueCents: row._sum.totalCents ?? 0,
      quantity: row._sum.quantity ?? 0,
    }));
  }

  protected async topProductsByQuantity(where: Prisma.OrderItemWhereInput, limit: number): Promise<TopEntry[]> {
    const rows = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where,
      _sum: { totalCents: true, quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });
    if (rows.length === 0) return [];
    const products = await this.prisma.product.findMany({
      where: { id: { in: rows.map((row) => row.productId) } },
      select: { id: true, name: true },
    });
    const nameById = new Map(products.map((product) => [product.id, product.name]));
    return rows.map((row) => ({
      id: row.productId,
      label: nameById.get(row.productId) ?? 'Unknown product',
      revenueCents: row._sum.totalCents ?? 0,
      quantity: row._sum.quantity ?? 0,
    }));
  }

  /**
   * Category and brand revenue breakdown. OrderItem does not carry categoryId/brandId
   * directly, so this groups by productId at the DB (bounded, indexed) then reduces to
   * category/brand totals in memory with a single hash-map pass — O(distinct products).
   */
  protected async categoryBrandBreakdown(
    where: Prisma.OrderItemWhereInput,
  ): Promise<{ categories: TopEntry[]; brands: TopEntry[] }> {
    interface ProductRevenueRow {
      productId: string;
      _sum: { totalCents: number | null; quantity: number | null };
    }
    const rows: ProductRevenueRow[] = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where,
      _sum: { totalCents: true, quantity: true },
      take: 500,
    });
    if (rows.length === 0) return { categories: [], brands: [] };

    interface ProductCategoryBrandRow {
      id: string;
      category: { id: string; name: string } | null;
      brand: { id: string; name: string } | null;
    }
    const products: ProductCategoryBrandRow[] = await this.prisma.product.findMany({
      where: { id: { in: rows.map((row) => row.productId) } },
      select: { id: true, category: { select: { id: true, name: true } }, brand: { select: { id: true, name: true } } },
    });
    const productById = new Map(products.map((product) => [product.id, product]));

    const categoryTotals = new Map<string, TopEntry>();
    const brandTotals = new Map<string, TopEntry>();
    for (const row of rows) {
      const product = productById.get(row.productId);
      const revenueCents = row._sum.totalCents ?? 0;
      const quantity = row._sum.quantity ?? 0;

      const category = product?.category;
      if (category) {
        const existing = categoryTotals.get(category.id);
        categoryTotals.set(category.id, {
          id: category.id,
          label: category.name,
          revenueCents: (existing?.revenueCents ?? 0) + revenueCents,
          quantity: (existing?.quantity ?? 0) + quantity,
        });
      }

      const brand = product?.brand;
      if (brand) {
        const existing = brandTotals.get(brand.id);
        brandTotals.set(brand.id, {
          id: brand.id,
          label: brand.name,
          revenueCents: (existing?.revenueCents ?? 0) + revenueCents,
          quantity: (existing?.quantity ?? 0) + quantity,
        });
      }
    }

    return {
      categories: this.aggregation.topN([...categoryTotals.values()], (entry) => entry.revenueCents, 20),
      brands: this.aggregation.topN([...brandTotals.values()], (entry) => entry.revenueCents, 20),
    };
  }

  /**
   * Inventory health grouped by product (summed across variants/warehouses). Bounded to 5000
   * rows per call for MVP safety; large catalogs should page by store/category in follow-up work.
   */
  protected async inventoryHealth(where: Prisma.InventoryWhereInput, limit: number): Promise<InventoryHealth> {
    interface InventoryRow {
      onHand: number;
      reserved: number;
      safetyStock: number;
      variant: { priceCents: number; product: { id: string; name: string } };
    }
    const rows: InventoryRow[] = await this.prisma.inventory.findMany({
      where,
      select: {
        onHand: true,
        reserved: true,
        safetyStock: true,
        variant: { select: { priceCents: true, product: { select: { id: true, name: true } } } },
      },
      take: 5000,
    });

    interface ProductAccumulator {
      productId: string;
      name: string;
      onHand: number;
      reserved: number;
      safetyStock: number;
      valueCents: number;
    }
    const byProduct = new Map<string, ProductAccumulator>();
    for (const row of rows) {
      const productId = row.variant.product.id;
      const existing = byProduct.get(productId);
      const sellableForRow = Math.max(row.onHand - row.reserved, 0);
      const acc: ProductAccumulator = existing ?? {
        productId,
        name: row.variant.product.name,
        onHand: 0,
        reserved: 0,
        safetyStock: 0,
        valueCents: 0,
      };
      acc.onHand += row.onHand;
      acc.reserved += row.reserved;
      acc.safetyStock += row.safetyStock;
      acc.valueCents += sellableForRow * row.variant.priceCents;
      byProduct.set(productId, acc);
    }

    const products = [...byProduct.values()];
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let reservedTotal = 0;
    let sellableTotal = 0;
    let inventoryValueCentsEstimate = 0;
    for (const product of products) {
      const sellable = product.onHand - product.reserved;
      reservedTotal += product.reserved;
      sellableTotal += sellable;
      inventoryValueCentsEstimate += product.valueCents;
      if (sellable <= 0) outOfStockCount += 1;
      else if (sellable <= product.safetyStock) lowStockCount += 1;
    }

    const lowStockProducts = this.aggregation
      .topN(products, (product) => -(product.onHand - product.reserved), limit)
      .map((product) => ({
        productId: product.productId,
        name: product.name,
        sellable: product.onHand - product.reserved,
        safetyStock: product.safetyStock,
      }));

    return {
      totalProducts: products.length,
      lowStockCount,
      outOfStockCount,
      reservedTotal,
      sellableTotal,
      inventoryValueCentsEstimate,
      lowStockProducts,
    };
  }
}

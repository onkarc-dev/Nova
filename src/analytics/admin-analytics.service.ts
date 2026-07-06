import { Injectable } from '@nestjs/common';
import { PaymentStatus, Prisma, ProductStatus, SellerStatus } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';
import { AnalyticsAggregationService } from './analytics-aggregation.service';
import { BaseAnalyticsQueryService } from './base-analytics-query.service';
import type { AnalyticsExportQueryDto, AnalyticsListQueryDto, AnalyticsPeriodQueryDto, AnalyticsTimeSeriesQueryDto } from './dto/analytics-query.dto';

interface OrderItemFilters {
  sellerId?: string | undefined;
  storeId?: string | undefined;
  productId?: string | undefined;
  categoryId?: string | undefined;
}

@Injectable()
export class AdminAnalyticsService extends BaseAnalyticsQueryService {
  // Explicit forwarding constructor: required so Nest emits design:paramtypes metadata for
  // this subclass; without it, DI would have nothing of its own to reflect on.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(prisma: PrismaService, aggregation: AnalyticsAggregationService) {
    super(prisma, aggregation);
  }

  async overview(query: AnalyticsPeriodQueryDto) {
    const period = this.aggregation.resolvePeriod(query.from, query.to);
    const placedAtRange = { gte: period.from, lte: period.to };

    const [
      gmvAgg,
      commissionAgg,
      totalOrders,
      cancelledOrders,
      paymentTotals,
      paymentSuccess,
      returnedOrderGroups,
      activeSellers,
      activeProducts,
      shipmentBreakdown,
      returnStats,
      topSellers,
      topProducts,
      inventory,
    ] = await Promise.all([
      this.prisma.order.aggregate({ where: { placedAt: placedAtRange, status: { not: 'CANCELLED' } }, _sum: { totalCents: true } }),
      this.prisma.commissionRecord.aggregate({
        where: { createdAt: placedAtRange, status: { not: 'REVERSED' } },
        _sum: { commissionAmountCents: true },
      }),
      this.prisma.order.count({ where: { placedAt: placedAtRange } }),
      this.prisma.order.count({ where: { placedAt: placedAtRange, status: 'CANCELLED' } }),
      this.prisma.payment.count({ where: { createdAt: placedAtRange } }),
      this.prisma.payment.count({ where: { createdAt: placedAtRange, status: { in: [PaymentStatus.CAPTURED, PaymentStatus.SUCCESS] } } }),
      this.prisma.return.groupBy({ by: ['orderId'], where: { createdAt: placedAtRange } }),
      this.prisma.seller.count({ where: { status: SellerStatus.APPROVED } }),
      this.prisma.product.count({ where: { status: ProductStatus.ACTIVE } }),
      this.shipmentStatusBreakdown({ createdAt: placedAtRange }),
      this.returnRefundStats(
        { createdAt: placedAtRange },
        { createdAt: placedAtRange },
        await this.prisma.order.count({ where: { placedAt: placedAtRange } }),
      ),
      this.topSellers({ createdAt: placedAtRange }, 5),
      this.topProducts({ order: { placedAt: placedAtRange } }, 5),
      this.inventoryHealth({}, 5),
    ]);

    const gmvCents = gmvAgg._sum.totalCents ?? 0;
    const refundCents = returnStats.refundAmountCents;
    const commissionCents = commissionAgg._sum.commissionAmountCents ?? 0;
    const paidOrders = paymentSuccess;

    return {
      period: { from: period.from.toISOString(), to: period.to.toISOString() },
      gmvCents,
      netRevenueCents: gmvCents - refundCents,
      commissionRevenueCents: commissionCents,
      refundAmountCents: refundCents,
      totalOrders,
      paidOrders,
      cancelledOrders,
      returnedOrders: returnedOrderGroups.length,
      paymentSuccessRatePercent: paymentTotals > 0 ? Number(((paymentSuccess / paymentTotals) * 100).toFixed(2)) : 0,
      averageOrderValueCents: totalOrders > 0 ? Math.round(gmvCents / totalOrders) : 0,
      activeSellers,
      activeProducts,
      lowStockProducts: inventory.lowStockCount,
      topSellers,
      topProducts,
      topCategories: (await this.categoryBrandBreakdown({ order: { placedAt: placedAtRange } })).categories.slice(0, 5),
      shipmentStatusBreakdown: shipmentBreakdown.byStatus,
      returnRatePercent: returnStats.returnRatePercent,
      refundRatePercent: returnStats.refundRatePercent,
    };
  }

  async revenue(query: AnalyticsTimeSeriesQueryDto) {
    const period = this.aggregation.resolvePeriod(query.from, query.to);
    const granularity = this.aggregation.resolveGranularity(query.granularity);
    const filters: OrderItemFilters = { sellerId: query.sellerId, storeId: query.storeId, productId: query.productId, categoryId: query.categoryId };

    const result = await this.buildRevenueSeries({
      period,
      granularity,
      orderItemWhere: this.orderItemWhere(period, filters),
      refundWhere: this.refundWhere(period, filters),
    });

    return { from: period.from.toISOString(), to: period.to.toISOString(), granularity, ...result };
  }

  async orders(query: AnalyticsTimeSeriesQueryDto) {
    const period = this.aggregation.resolvePeriod(query.from, query.to);
    const placedAtRange = { gte: period.from, lte: period.to };
    const orderWhere: Prisma.OrderWhereInput = {
      placedAt: placedAtRange,
      ...(query.sellerId ? { items: { some: { sellerId: query.sellerId } } } : {}),
      ...(query.storeId ? { items: { some: { storeId: query.storeId } } } : {}),
    };

    const [totalOrders, byStatus, revenueSeries] = await Promise.all([
      this.prisma.order.count({ where: orderWhere }),
      this.orderStatusBreakdown(orderWhere),
      query.granularity
        ? this.buildRevenueSeries({
            period,
            granularity: this.aggregation.resolveGranularity(query.granularity),
            orderItemWhere: this.orderItemWhere(period, {
              sellerId: query.sellerId,
              storeId: query.storeId,
              productId: query.productId,
              categoryId: query.categoryId,
            }),
            refundWhere: this.refundWhere(period, {
              sellerId: query.sellerId,
              storeId: query.storeId,
              productId: query.productId,
              categoryId: query.categoryId,
            }),
          })
        : null,
    ]);

    return {
      from: period.from.toISOString(),
      to: period.to.toISOString(),
      totalOrders,
      byStatus,
      buckets: revenueSeries?.buckets.map((bucket) => ({ bucketStart: bucket.bucketStart, bucketEnd: bucket.bucketEnd, orderCount: bucket.orderCount, itemQuantity: bucket.itemQuantity })) ?? null,
    };
  }

  async payments(query: AnalyticsPeriodQueryDto) {
    const period = this.aggregation.resolvePeriod(query.from, query.to);
    const createdAtRange = { gte: period.from, lte: period.to };

    const [created, captured, failed, refundCount, refundAmount, providerRows, dailyFailedBuckets] = await Promise.all([
      this.prisma.payment.count({ where: { createdAt: createdAtRange } }),
      this.prisma.payment.count({ where: { createdAt: createdAtRange, status: { in: [PaymentStatus.CAPTURED, PaymentStatus.SUCCESS] } } }),
      this.prisma.payment.count({ where: { createdAt: createdAtRange, status: PaymentStatus.FAILED } }),
      this.prisma.refund.count({ where: { createdAt: createdAtRange } }),
      this.prisma.refund.aggregate({ where: { createdAt: createdAtRange, status: 'PROCESSED' }, _sum: { amountCents: true } }),
      this.prisma.payment.groupBy({ by: ['provider'], where: { createdAt: createdAtRange }, _count: { _all: true }, _sum: { amountCents: true } }),
      this.prisma.payment.findMany({ where: { createdAt: createdAtRange, status: PaymentStatus.FAILED }, select: { createdAt: true } }),
    ]);

    const failedTrendBuckets = this.aggregation.countEventsIntoBuckets(
      dailyFailedBuckets.map((row: { createdAt: Date }) => row.createdAt),
      period,
      this.aggregation.resolveGranularity(),
    );

    return {
      from: period.from.toISOString(),
      to: period.to.toISOString(),
      created,
      captured,
      failed,
      successRatePercent: created > 0 ? Number(((captured / created) * 100).toFixed(2)) : 0,
      refundCount,
      refundAmountCents: refundAmount._sum.amountCents ?? 0,
      byProvider: providerRows.map((row: { provider: string; _count: { _all: number }; _sum: { amountCents: number | null } }) => ({
        provider: row.provider,
        count: row._count._all,
        amountCents: row._sum.amountCents ?? 0,
      })),
      failedPaymentTrend: failedTrendBuckets.map((bucket) => ({
        bucketStart: bucket.bucketStart,
        bucketEnd: bucket.bucketEnd,
        failedCount: bucket.itemQuantity,
      })),
    };
  }

  async shipments(query: AnalyticsPeriodQueryDto) {
    const period = this.aggregation.resolvePeriod(query.from, query.to);
    const breakdown = await this.shipmentStatusBreakdown({ createdAt: { gte: period.from, lte: period.to } });
    return { from: period.from.toISOString(), to: period.to.toISOString(), ...breakdown };
  }

  async returns(query: AnalyticsPeriodQueryDto) {
    const period = this.aggregation.resolvePeriod(query.from, query.to);
    const placedAtRange = { gte: period.from, lte: period.to };
    const totalOrders = await this.prisma.order.count({ where: { placedAt: placedAtRange } });
    const stats = await this.returnRefundStats({ createdAt: placedAtRange }, { createdAt: placedAtRange }, totalOrders);
    return { from: period.from.toISOString(), to: period.to.toISOString(), ...stats };
  }

  async products(query: AnalyticsListQueryDto) {
    const period = this.aggregation.resolvePeriod(query.from, query.to);
    const limit = query.limit ?? 10;
    const where: Prisma.OrderItemWhereInput = { order: { placedAt: { gte: period.from, lte: period.to } } };

    const [topByRevenue, topByQuantity, inventory] = await Promise.all([
      this.topProducts(where, limit),
      this.topProductsByQuantity(where, limit),
      this.inventoryHealth({}, limit),
    ]);

    return {
      from: period.from.toISOString(),
      to: period.to.toISOString(),
      topByRevenue,
      topByQuantity,
      lowStockProducts: inventory.lowStockProducts,
      lowStockCount: inventory.lowStockCount,
      outOfStockCount: inventory.outOfStockCount,
      // No product view/click event stream exists yet, so conversion rate cannot be computed
      // honestly. Left as an explicit null rather than a fabricated number.
      conversionRatePercent: null,
    };
  }

  async sellers(query: AnalyticsListQueryDto) {
    const period = this.aggregation.resolvePeriod(query.from, query.to);
    const limit = query.limit ?? 10;
    const topSellersList = await this.topSellers({ createdAt: { gte: period.from, lte: period.to } }, limit);
    return { from: period.from.toISOString(), to: period.to.toISOString(), topSellers: topSellersList };
  }

  async categories(query: AnalyticsListQueryDto) {
    const period = this.aggregation.resolvePeriod(query.from, query.to);
    const breakdown = await this.categoryBrandBreakdown({ order: { placedAt: { gte: period.from, lte: period.to } } });
    const limit = query.limit ?? 20;
    return {
      from: period.from.toISOString(),
      to: period.to.toISOString(),
      topCategories: breakdown.categories.slice(0, limit),
      topBrands: breakdown.brands.slice(0, limit),
    };
  }

  async inventory(query: AnalyticsListQueryDto) {
    const limit = query.limit ?? 10;
    return this.inventoryHealth({}, limit);
  }

  async exportCsv(query: AnalyticsExportQueryDto): Promise<{ csv: string; filename: string }> {
    const period = this.aggregation.resolvePeriod(query.from, query.to);
    const filenameSuffix = `${period.from.toISOString().slice(0, 10)}_${period.to.toISOString().slice(0, 10)}`;

    if (query.type === 'revenue' || query.type === 'orders') {
      const result = await this.buildRevenueSeries({
        period,
        granularity: 'day',
        orderItemWhere: this.orderItemWhere(period, {}),
        refundWhere: this.refundWhere(period, {}),
      });
      const csv = this.aggregation.toCsv(
        ['bucketStart', 'bucketEnd', 'grossSalesCents', 'netSalesCents', 'commissionCents', 'refundCents', 'orderCount', 'itemQuantity'],
        result.buckets,
      );
      return { csv, filename: `admin-${query.type}-${filenameSuffix}.csv` };
    }

    if (query.type === 'products') {
      const rows = await this.topProducts({ order: { placedAt: { gte: period.from, lte: period.to } } }, 200);
      const csv = this.aggregation.toCsv(
        ['id', 'label', 'revenueCents', 'quantity'],
        rows.map((row) => ({ id: row.id, label: row.label, revenueCents: row.revenueCents, quantity: row.quantity })),
      );
      return { csv, filename: `admin-products-${filenameSuffix}.csv` };
    }

    // settlements
    const settlements = await this.prisma.sellerSettlement.findMany({
      where: { periodStart: { gte: period.from }, periodEnd: { lte: period.to } },
      select: { id: true, sellerId: true, storeId: true, settlementNumber: true, grossAmountCents: true, commissionAmountCents: true, netPayoutCents: true, status: true, periodStart: true, periodEnd: true },
      take: 500,
    });
    const csv = this.aggregation.toCsv(
      ['id', 'sellerId', 'storeId', 'settlementNumber', 'grossAmountCents', 'commissionAmountCents', 'netPayoutCents', 'status', 'periodStart', 'periodEnd'],
      settlements.map((row) => ({ ...row, periodStart: row.periodStart.toISOString(), periodEnd: row.periodEnd.toISOString() })),
    );
    return { csv, filename: `admin-settlements-${filenameSuffix}.csv` };
  }

  private async topSellers(where: Prisma.CommissionRecordWhereInput, limit: number) {
    const rows = await this.prisma.commissionRecord.groupBy({
      by: ['sellerId'],
      where,
      _sum: { grossAmountCents: true, commissionAmountCents: true, netAmountCents: true },
      _count: { _all: true },
      orderBy: { _sum: { grossAmountCents: 'desc' } },
      take: limit,
    });
    if (rows.length === 0) return [];
    const sellers = await this.prisma.seller.findMany({ where: { id: { in: rows.map((row) => row.sellerId) } }, select: { id: true, businessName: true } });
    const nameById = new Map(sellers.map((seller) => [seller.id, seller.businessName]));
    return rows.map((row) => ({
      sellerId: row.sellerId,
      businessName: nameById.get(row.sellerId) ?? 'Unknown seller',
      grossSalesCents: row._sum.grossAmountCents ?? 0,
      commissionCents: row._sum.commissionAmountCents ?? 0,
      netEarningsCents: row._sum.netAmountCents ?? 0,
      orderItemCount: row._count._all,
    }));
  }

  private orderItemWhere(period: { from: Date; to: Date }, filters: OrderItemFilters): Prisma.OrderItemWhereInput {
    return {
      order: { placedAt: { gte: period.from, lte: period.to } },
      ...(filters.sellerId ? { sellerId: filters.sellerId } : {}),
      ...(filters.storeId ? { storeId: filters.storeId } : {}),
      ...(filters.productId ? { productId: filters.productId } : {}),
      ...(filters.categoryId ? { product: { categoryId: filters.categoryId } } : {}),
    };
  }

  private refundWhere(period: { from: Date; to: Date }, filters: OrderItemFilters): Prisma.RefundWhereInput {
    const hasScope = Boolean(filters.sellerId ?? filters.storeId ?? filters.productId ?? filters.categoryId);
    return {
      createdAt: { gte: period.from, lte: period.to },
      ...(hasScope
        ? {
            order: {
              items: {
                some: {
                  ...(filters.sellerId ? { sellerId: filters.sellerId } : {}),
                  ...(filters.storeId ? { storeId: filters.storeId } : {}),
                  ...(filters.productId ? { productId: filters.productId } : {}),
                  ...(filters.categoryId ? { product: { categoryId: filters.categoryId } } : {}),
                },
              },
            },
          }
        : {}),
    };
  }
}

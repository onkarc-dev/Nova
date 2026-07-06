import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { PrismaService } from '@database/prisma.service';
import { AnalyticsAggregationService } from './analytics-aggregation.service';
import { BaseAnalyticsQueryService } from './base-analytics-query.service';
import type {
  AnalyticsExportQueryDto,
  AnalyticsListQueryDto,
  AnalyticsPeriodQueryDto,
  SellerAnalyticsTimeSeriesQueryDto,
} from './dto/analytics-query.dto';

interface SellerScope {
  sellerId: string;
  storeIds: string[];
}

interface SellerItemFilters {
  storeId?: string | undefined;
  productId?: string | undefined;
  categoryId?: string | undefined;
}

/**
 * Seller-facing analytics. Every query is anchored to the caller's own seller record —
 * resolved once from the authenticated user, never taken from the request — so a seller can
 * only ever see their own stores/products/orders/shipments/settlements, never platform-wide
 * data or another seller's numbers.
 */
@Injectable()
export class SellerAnalyticsService extends BaseAnalyticsQueryService {
  // Explicit forwarding constructor: required so Nest emits design:paramtypes metadata for
  // this subclass (see AdminAnalyticsService for the same note).
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(prisma: PrismaService, aggregation: AnalyticsAggregationService) {
    super(prisma, aggregation);
  }

  async overview(user: AuthUser, query: AnalyticsPeriodQueryDto) {
    const scope = await this.resolveScope(user);
    const period = this.aggregation.resolvePeriod(query.from, query.to);
    const placedAtRange = { gte: period.from, lte: period.to };
    const orderWhere: Prisma.OrderWhereInput = { placedAt: placedAtRange, items: { some: { sellerId: scope.sellerId } } };
    const orderItemWhere: Prisma.OrderItemWhereInput = { sellerId: scope.sellerId, order: { placedAt: placedAtRange } };

    const [gross, totalOrders, byStatus, shipmentBreakdown, returnStats, topProducts, inventory, activeProductCount] = await Promise.all([
      this.prisma.orderItem.aggregate({ where: orderItemWhere, _sum: { totalCents: true, commissionAmountCents: true } }),
      this.prisma.order.count({ where: orderWhere }),
      this.orderStatusBreakdown(orderWhere),
      this.shipmentStatusBreakdown({ sellerId: scope.sellerId, createdAt: placedAtRange }),
      this.returnRefundStats(
        { createdAt: placedAtRange, order: { items: { some: { sellerId: scope.sellerId } } } },
        { createdAt: placedAtRange, order: { items: { some: { sellerId: scope.sellerId } } } },
        await this.prisma.order.count({ where: orderWhere }),
      ),
      this.topProducts(orderItemWhere, 5),
      this.inventoryHealth({ storeId: { in: scope.storeIds } }, 5),
      this.prisma.product.count({ where: { storeId: { in: scope.storeIds }, status: 'ACTIVE' } }),
    ]);

    const grossSalesCents = gross._sum.totalCents ?? 0;
    const commissionCents = gross._sum.commissionAmountCents ?? 0;

    return {
      period: { from: period.from.toISOString(), to: period.to.toISOString() },
      grossSalesCents,
      netSalesCents: grossSalesCents - returnStats.refundAmountCents - commissionCents,
      commissionCents,
      refundAmountCents: returnStats.refundAmountCents,
      totalOrders,
      byStatus,
      averageOrderValueCents: totalOrders > 0 ? Math.round(grossSalesCents / totalOrders) : 0,
      activeProductCount,
      lowStockCount: inventory.lowStockCount,
      outOfStockCount: inventory.outOfStockCount,
      topProducts,
      shipmentStatusBreakdown: shipmentBreakdown.byStatus,
      returnRatePercent: returnStats.returnRatePercent,
      refundRatePercent: returnStats.refundRatePercent,
    };
  }

  async revenue(user: AuthUser, query: SellerAnalyticsTimeSeriesQueryDto) {
    const scope = await this.resolveScope(user);
    const period = this.aggregation.resolvePeriod(query.from, query.to);
    const granularity = this.aggregation.resolveGranularity(query.granularity);
    const filters: SellerItemFilters = { storeId: query.storeId, productId: query.productId, categoryId: query.categoryId };

    const result = await this.buildRevenueSeries({
      period,
      granularity,
      orderItemWhere: this.orderItemWhere(scope, period, filters),
      refundWhere: this.refundWhere(scope, period, filters),
    });

    return { from: period.from.toISOString(), to: period.to.toISOString(), granularity, ...result };
  }

  async orders(user: AuthUser, query: SellerAnalyticsTimeSeriesQueryDto) {
    const scope = await this.resolveScope(user);
    const period = this.aggregation.resolvePeriod(query.from, query.to);
    const orderWhere: Prisma.OrderWhereInput = {
      placedAt: { gte: period.from, lte: period.to },
      items: { some: { sellerId: scope.sellerId, ...(query.storeId ? { storeId: query.storeId } : {}) } },
    };

    const [totalOrders, byStatus] = await Promise.all([this.prisma.order.count({ where: orderWhere }), this.orderStatusBreakdown(orderWhere)]);

    return { from: period.from.toISOString(), to: period.to.toISOString(), totalOrders, byStatus };
  }

  async products(user: AuthUser, query: AnalyticsListQueryDto) {
    const scope = await this.resolveScope(user);
    const period = this.aggregation.resolvePeriod(query.from, query.to);
    const limit = query.limit ?? 10;
    const where: Prisma.OrderItemWhereInput = { sellerId: scope.sellerId, order: { placedAt: { gte: period.from, lte: period.to } } };

    const [topByRevenue, topByQuantity, inventory] = await Promise.all([
      this.topProducts(where, limit),
      this.topProductsByQuantity(where, limit),
      this.inventoryHealth({ storeId: { in: scope.storeIds } }, limit),
    ]);

    return {
      from: period.from.toISOString(),
      to: period.to.toISOString(),
      topByRevenue,
      topByQuantity,
      lowStockProducts: inventory.lowStockProducts,
      lowStockCount: inventory.lowStockCount,
      outOfStockCount: inventory.outOfStockCount,
    };
  }

  async inventory(user: AuthUser, query: AnalyticsListQueryDto) {
    const scope = await this.resolveScope(user);
    const limit = query.limit ?? 10;
    return this.inventoryHealth({ storeId: { in: scope.storeIds } }, limit);
  }

  async shipments(user: AuthUser, query: AnalyticsPeriodQueryDto) {
    const scope = await this.resolveScope(user);
    const period = this.aggregation.resolvePeriod(query.from, query.to);
    const breakdown = await this.shipmentStatusBreakdown({ sellerId: scope.sellerId, createdAt: { gte: period.from, lte: period.to } });
    return { from: period.from.toISOString(), to: period.to.toISOString(), ...breakdown };
  }

  async returns(user: AuthUser, query: AnalyticsPeriodQueryDto) {
    const scope = await this.resolveScope(user);
    const period = this.aggregation.resolvePeriod(query.from, query.to);
    const placedAtRange = { gte: period.from, lte: period.to };
    const orderWhere: Prisma.OrderWhereInput = { placedAt: placedAtRange, items: { some: { sellerId: scope.sellerId } } };
    const scopedWhere = { createdAt: placedAtRange, order: { items: { some: { sellerId: scope.sellerId } } } };

    const totalOrders = await this.prisma.order.count({ where: orderWhere });
    const stats = await this.returnRefundStats(scopedWhere, scopedWhere, totalOrders);
    return { from: period.from.toISOString(), to: period.to.toISOString(), ...stats };
  }

  async exportCsv(user: AuthUser, query: AnalyticsExportQueryDto): Promise<{ csv: string; filename: string }> {
    const scope = await this.resolveScope(user);
    const period = this.aggregation.resolvePeriod(query.from, query.to);
    const filenameSuffix = `${period.from.toISOString().slice(0, 10)}_${period.to.toISOString().slice(0, 10)}`;

    if (query.type === 'revenue' || query.type === 'orders') {
      const result = await this.buildRevenueSeries({
        period,
        granularity: 'day',
        orderItemWhere: this.orderItemWhere(scope, period, {}),
        refundWhere: this.refundWhere(scope, period, {}),
      });
      const csv = this.aggregation.toCsv(
        ['bucketStart', 'bucketEnd', 'grossSalesCents', 'netSalesCents', 'commissionCents', 'refundCents', 'orderCount', 'itemQuantity'],
        result.buckets,
      );
      return { csv, filename: `seller-${query.type}-${filenameSuffix}.csv` };
    }

    if (query.type === 'products') {
      const rows = await this.topProducts({ sellerId: scope.sellerId, order: { placedAt: { gte: period.from, lte: period.to } } }, 200);
      const csv = this.aggregation.toCsv(
        ['id', 'label', 'revenueCents', 'quantity'],
        rows.map((row) => ({ id: row.id, label: row.label, revenueCents: row.revenueCents, quantity: row.quantity })),
      );
      return { csv, filename: `seller-products-${filenameSuffix}.csv` };
    }

    // settlements — read-only projection of this seller's own SellerSettlement rows.
    const settlements = await this.prisma.sellerSettlement.findMany({
      where: { sellerId: scope.sellerId, periodStart: { gte: period.from }, periodEnd: { lte: period.to } },
      select: { id: true, storeId: true, settlementNumber: true, grossAmountCents: true, commissionAmountCents: true, netPayoutCents: true, status: true, periodStart: true, periodEnd: true },
      take: 500,
    });
    const csv = this.aggregation.toCsv(
      ['id', 'storeId', 'settlementNumber', 'grossAmountCents', 'commissionAmountCents', 'netPayoutCents', 'status', 'periodStart', 'periodEnd'],
      settlements.map((row) => ({ ...row, periodStart: row.periodStart.toISOString(), periodEnd: row.periodEnd.toISOString() })),
    );
    return { csv, filename: `seller-settlements-${filenameSuffix}.csv` };
  }

  private async resolveScope(user: AuthUser): Promise<SellerScope> {
    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (!seller) throw new NotFoundException('Seller profile not found.');
    const stores = await this.prisma.store.findMany({ where: { sellerId: seller.id }, select: { id: true } });
    return { sellerId: seller.id, storeIds: stores.map((store) => store.id) };
  }

  private orderItemWhere(scope: SellerScope, period: { from: Date; to: Date }, filters: SellerItemFilters): Prisma.OrderItemWhereInput {
    return {
      sellerId: scope.sellerId,
      order: { placedAt: { gte: period.from, lte: period.to } },
      ...(filters.storeId ? { storeId: filters.storeId } : {}),
      ...(filters.productId ? { productId: filters.productId } : {}),
      ...(filters.categoryId ? { product: { categoryId: filters.categoryId } } : {}),
    };
  }

  private refundWhere(scope: SellerScope, period: { from: Date; to: Date }, filters: SellerItemFilters): Prisma.RefundWhereInput {
    return {
      createdAt: { gte: period.from, lte: period.to },
      order: {
        items: {
          some: {
            sellerId: scope.sellerId,
            ...(filters.storeId ? { storeId: filters.storeId } : {}),
            ...(filters.productId ? { productId: filters.productId } : {}),
            ...(filters.categoryId ? { product: { categoryId: filters.categoryId } } : {}),
          },
        },
      },
    };
  }
}

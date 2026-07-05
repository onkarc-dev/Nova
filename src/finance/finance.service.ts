import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CommissionStatus,
  NotificationType,
  PaymentEventType,
  PaymentStatus,
  Prisma,
  SellerStatus,
  SettlementStatus,
} from '@prisma/client';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { PrismaService } from '@database/prisma.service';
import { NotificationsService } from '@/notifications/notifications.service';
import type {
  CommissionQueryDto,
  FinancePeriodQueryDto,
  GenerateSettlementsDto,
  SettlementQueryDto,
  UpdateSettlementStatusDto,
} from './dto/finance-query.dto';

type SellerScope = Prisma.SellerGetPayload<{ include: { stores: true; user: true } }>;
interface CommissionSeed {
  paymentId: string;
  orderId: string;
  eventType?: PaymentEventType;
  status?: PaymentStatus;
}

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createCommissionsForPayment(seed: CommissionSeed) {
    if (!this.isCapturedPayment(seed.status, seed.eventType)) return { created: 0, skipped: true };

    return this.prisma.runInTransaction((tx) => this.createCommissionsForPaymentTx(tx, seed.paymentId));
  }

  async createCommissionsForPaymentTx(tx: Prisma.TransactionClient, paymentId: string) {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { order: { include: { items: { include: { seller: { include: { user: true } } } } } } },
    });
    if (!payment) throw new NotFoundException('Payment not found.');

    let created = 0;
    for (const item of payment.order.items) {
      const rateBps = this.resolveCommissionRateBps(item.commissionRateSnapshot);
      const commissionAmountCents = Math.round((item.totalCents * rateBps) / 10_000);
      const result = await tx.commissionRecord.upsert({
        where: { orderItemId_paymentId: { orderItemId: item.id, paymentId: payment.id } },
        create: {
          sellerId: item.sellerId,
          storeId: item.storeId,
          orderId: item.orderId,
          orderItemId: item.id,
          paymentId: payment.id,
          grossAmountCents: item.totalCents,
          commissionRateBps: rateBps,
          commissionAmountCents,
          netAmountCents: item.totalCents - commissionAmountCents,
          currency: payment.currency,
          status: CommissionStatus.PENDING,
          metadata: { source: 'payment_capture' },
        },
        update: {},
      });
      if (result.createdAt.getTime() === result.updatedAt.getTime()) created += 1;
    }

    return { created, skipped: false };
  }

  async reverseCommissionsForReturn(returnId: string) {
    return this.prisma.runInTransaction((tx) => this.reverseCommissionsForReturnTx(tx, returnId));
  }

  async reverseCommissionsForReturnTx(tx: Prisma.TransactionClient, returnId: string) {
    const returnRequest = await tx.return.findUnique({
      where: { id: returnId },
      include: { order: { include: { items: true } } },
    });
    if (!returnRequest) throw new NotFoundException('Return not found.');

    const orderItemIds = returnRequest.order.items.map((item) => item.id);
    const updated = await tx.commissionRecord.updateMany({
      where: {
        orderId: returnRequest.orderId,
        orderItemId: { in: orderItemIds },
        status: { in: [CommissionStatus.PENDING, CommissionStatus.LOCKED] },
      },
      data: { status: CommissionStatus.REVERSED, metadata: { reversedByReturnId: returnId } },
    });

    if (updated.count > 0) {
      const commissions = await tx.commissionRecord.findMany({
        where: { orderId: returnRequest.orderId, orderItemId: { in: orderItemIds } },
        include: { seller: { include: { user: true } } },
      });
      await Promise.all(
        commissions.map((commission) =>
          this.notifySeller(commission.seller.userId, 'Commission reversed', 'A commission was reversed because a return was requested.', {
            commissionId: commission.id,
            returnId,
          }),
        ),
      );
    }

    return updated;
  }

  async getSellerRevenue(user: AuthUser, query: FinancePeriodQueryDto) {
    const seller = await this.getApprovedSeller(user.id);
    const where = this.sellerCommissionWhere(seller, query);
    const [gross, commission, reversed, orderCount, topProducts] = await Promise.all([
      this.prisma.commissionRecord.aggregate({ where, _sum: { grossAmountCents: true } }),
      this.prisma.commissionRecord.aggregate({ where, _sum: { commissionAmountCents: true, netAmountCents: true } }),
      this.prisma.commissionRecord.aggregate({
        where: { ...where, status: CommissionStatus.REVERSED },
        _sum: { netAmountCents: true },
      }),
      this.prisma.commissionRecord.groupBy({ by: ['orderId'], where }),
      this.topProducts(where),
    ]);

    const paid = await this.prisma.sellerSettlement.aggregate({
      where: { sellerId: seller.id, status: SettlementStatus.PAID },
      _sum: { netPayoutCents: true },
    });
    const pending = await this.prisma.sellerSettlement.aggregate({
      where: { sellerId: seller.id, status: { in: [SettlementStatus.PENDING, SettlementStatus.PROCESSING] } },
      _sum: { netPayoutCents: true },
    });

    return {
      grossSalesCents: gross._sum.grossAmountCents ?? 0,
      commissionCents: commission._sum.commissionAmountCents ?? 0,
      refundsCents: Math.abs(reversed._sum.netAmountCents ?? 0),
      netEarningsCents: commission._sum.netAmountCents ?? 0,
      pendingPayoutCents: pending._sum.netPayoutCents ?? 0,
      paidPayoutCents: paid._sum.netPayoutCents ?? 0,
      orderCount: orderCount.length,
      topProducts,
    };
  }

  async listSellerCommissions(user: AuthUser, query: CommissionQueryDto) {
    const seller = await this.getApprovedSeller(user.id);
    return this.prisma.commissionRecord.findMany({
      where: this.sellerCommissionWhere(seller, query),
      orderBy: { createdAt: 'desc' },
      include: { orderItem: true, order: true, payment: true, settlement: true },
    });
  }

  async getSellerPayoutSummary(user: AuthUser) {
    const seller = await this.getApprovedSeller(user.id);
    const aggregateStatus = (status: SettlementStatus) =>
      this.prisma.sellerSettlement.aggregate({
        where: { sellerId: seller.id, status },
        _sum: { netPayoutCents: true },
        _count: { id: true },
      });
    const [pending, processing, paid, failed] = await Promise.all([
      aggregateStatus(SettlementStatus.PENDING),
      aggregateStatus(SettlementStatus.PROCESSING),
      aggregateStatus(SettlementStatus.PAID),
      aggregateStatus(SettlementStatus.FAILED),
    ]);

    return {
      pendingPayoutCents: pending._sum.netPayoutCents ?? 0,
      processingPayoutCents: processing._sum.netPayoutCents ?? 0,
      paidPayoutCents: paid._sum.netPayoutCents ?? 0,
      failedPayoutCents: failed._sum.netPayoutCents ?? 0,
      counts: {
        pending: pending._count.id,
        processing: processing._count.id,
        paid: paid._count.id,
        failed: failed._count.id,
      },
    };
  }

  async listSellerSettlements(user: AuthUser, query: SettlementQueryDto) {
    const seller = await this.getApprovedSeller(user.id);
    return this.prisma.sellerSettlement.findMany({
      where: this.sellerSettlementWhere(seller, query),
      orderBy: { periodStart: 'desc' },
      include: { commissions: true },
    });
  }

  async getSellerSettlement(user: AuthUser, settlementId: string) {
    const seller = await this.getApprovedSeller(user.id);
    const settlement = await this.prisma.sellerSettlement.findFirst({
      where: { id: settlementId, sellerId: seller.id },
      include: { commissions: true },
    });
    if (!settlement) throw new NotFoundException('Settlement not found.');
    return settlement;
  }

  listAdminCommissions(query: CommissionQueryDto) {
    return this.prisma.commissionRecord.findMany({
      where: this.adminCommissionWhere(query),
      orderBy: { createdAt: 'desc' },
      include: { seller: true, store: true, order: true, orderItem: true, settlement: true },
    });
  }

  listAdminSettlements(query: SettlementQueryDto) {
    return this.prisma.sellerSettlement.findMany({
      where: this.adminSettlementWhere(query),
      orderBy: { periodStart: 'desc' },
      include: { seller: true, store: true, commissions: true },
    });
  }

  async getAdminSettlement(settlementId: string) {
    const settlement = await this.prisma.sellerSettlement.findUnique({
      where: { id: settlementId },
      include: { seller: true, store: true, commissions: true },
    });
    if (!settlement) throw new NotFoundException('Settlement not found.');
    return settlement;
  }

  async generateSettlements(dto: GenerateSettlementsDto) {
    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);
    if (periodStart >= periodEnd) throw new BadRequestException('Settlement period start must be before period end.');

    const where: Prisma.CommissionRecordWhereInput = {
      status: CommissionStatus.PENDING,
      createdAt: { gte: periodStart, lt: periodEnd },
    };
    if (dto.sellerId) where.sellerId = dto.sellerId;
    if (dto.storeId) where.storeId = dto.storeId;

    const commissions = await this.prisma.commissionRecord.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: { seller: true, store: true },
    });

    const groups = new Map<string, typeof commissions>();
    for (const commission of commissions) {
      const key = `${commission.sellerId}:${commission.storeId}:${commission.currency}`;
      groups.set(key, [...(groups.get(key) ?? []), commission]);
    }

    const settlements = [];
    for (const group of groups.values()) {
      const first = group[0];
      if (!first) continue;
      const grossAmountCents = group.reduce((sum, item) => sum + item.grossAmountCents, 0);
      const commissionAmountCents = group.reduce((sum, item) => sum + item.commissionAmountCents, 0);
      const netPayoutCents = group.reduce((sum, item) => sum + item.netAmountCents, 0);
      const settlementNumber = this.createSettlementNumber(first.sellerId, first.storeId, periodStart, periodEnd);

      const settlement = await this.prisma.sellerSettlement.upsert({
        where: { sellerId_storeId_periodStart_periodEnd: { sellerId: first.sellerId, storeId: first.storeId, periodStart, periodEnd } },
        create: {
          sellerId: first.sellerId,
          storeId: first.storeId,
          settlementNumber,
          grossAmountCents,
          commissionAmountCents,
          refundAdjustmentCents: 0,
          netPayoutCents,
          currency: first.currency,
          periodStart,
          periodEnd,
          metadata: { commissionIds: group.map((item) => item.id) },
        },
        update: {},
        include: { seller: true },
      });

      await this.prisma.commissionRecord.updateMany({
        where: { id: { in: group.map((item) => item.id) }, settlementId: null },
        data: { settlementId: settlement.id, status: CommissionStatus.LOCKED },
      });
      await this.notifySeller(first.seller.userId, 'Settlement generated', 'A new seller settlement is ready for review.', {
        settlementId: settlement.id,
      });
      settlements.push(settlement);
    }

    return settlements;
  }

  async updateSettlementStatus(settlementId: string, dto: UpdateSettlementStatusDto) {
    const data: Prisma.SellerSettlementUpdateInput = { status: dto.status };
    if (dto.status === SettlementStatus.PAID) data.paidAt = new Date();
    if (dto.status === SettlementStatus.FAILED) data.failedAt = new Date();

    const settlement = await this.prisma.sellerSettlement.update({
      where: { id: settlementId },
      data,
      include: { seller: true },
    });

    if (dto.status === SettlementStatus.PAID) {
      await this.prisma.commissionRecord.updateMany({
        where: { settlementId: settlement.id, status: CommissionStatus.LOCKED },
        data: { status: CommissionStatus.SETTLED },
      });
    }

    if (dto.status === SettlementStatus.PAID || dto.status === SettlementStatus.FAILED) {
      await this.notifySeller(settlement.seller.userId, `Settlement ${dto.status.toLowerCase()}`, 'A seller settlement status changed.', {
        settlementId: settlement.id,
        status: dto.status,
      });
    }

    return settlement;
  }

  async getAdminFinanceOverview(query: FinancePeriodQueryDto) {
    const where = this.adminCommissionWhere(query);
    const [gross, reversed, settlements, orderGroups] = await Promise.all([
      this.prisma.commissionRecord.aggregate({
        where,
        _sum: { grossAmountCents: true, commissionAmountCents: true, netAmountCents: true },
      }),
      this.prisma.commissionRecord.aggregate({ where: { ...where, status: CommissionStatus.REVERSED }, _sum: { netAmountCents: true } }),
      this.prisma.sellerSettlement.aggregate({
        where: this.adminSettlementWhere(query),
        _sum: { netPayoutCents: true },
        _count: { id: true },
      }),
      this.prisma.commissionRecord.groupBy({ by: ['orderId'], where }),
    ]);

    return {
      grossSalesCents: gross._sum.grossAmountCents ?? 0,
      commissionCents: gross._sum.commissionAmountCents ?? 0,
      refundsCents: Math.abs(reversed._sum.netAmountCents ?? 0),
      netEarningsCents: gross._sum.netAmountCents ?? 0,
      pendingPayoutCents: settlements._sum.netPayoutCents ?? 0,
      settlementCount: settlements._count.id,
      orderCount: orderGroups.length,
      topProducts: await this.topProducts(where),
    };
  }

  async getAdminSellerEarnings(query: FinancePeriodQueryDto) {
    const rows = await this.prisma.commissionRecord.groupBy({
      by: ['sellerId'],
      where: this.adminCommissionWhere(query),
      _sum: { grossAmountCents: true, commissionAmountCents: true, netAmountCents: true },
      _count: { orderId: true },
      orderBy: { _sum: { netAmountCents: 'desc' } },
    });
    const sellers = await this.prisma.seller.findMany({ where: { id: { in: rows.map((row) => row.sellerId) } } });
    const sellerById = new Map(sellers.map((seller) => [seller.id, seller]));

    return rows.map((row) => ({
      seller: sellerById.get(row.sellerId),
      grossSalesCents: row._sum.grossAmountCents ?? 0,
      commissionCents: row._sum.commissionAmountCents ?? 0,
      netEarningsCents: row._sum.netAmountCents ?? 0,
      commissionRecordCount: row._count.orderId,
    }));
  }

  private async getApprovedSeller(userId: string): Promise<SellerScope> {
    const seller = await this.prisma.seller.findUnique({ where: { userId }, include: { stores: true, user: true } });
    if (!seller) throw new NotFoundException('Seller profile not found.');
    if (seller.status !== SellerStatus.APPROVED) throw new BadRequestException('Seller profile is not approved.');
    return seller;
  }

  private sellerCommissionWhere(seller: SellerScope, query: CommissionQueryDto | FinancePeriodQueryDto): Prisma.CommissionRecordWhereInput {
    return { ...this.adminCommissionWhere(query), sellerId: seller.id };
  }

  private sellerSettlementWhere(seller: SellerScope, query: SettlementQueryDto): Prisma.SellerSettlementWhereInput {
    return { ...this.adminSettlementWhere(query), sellerId: seller.id };
  }

  private adminCommissionWhere(query: CommissionQueryDto | FinancePeriodQueryDto): Prisma.CommissionRecordWhereInput {
    const typed = query as CommissionQueryDto;
    const where: Prisma.CommissionRecordWhereInput = {};
    if (typed.sellerId) where.sellerId = typed.sellerId;
    if (typed.storeId) where.storeId = typed.storeId;
    if (typed.status) where.status = typed.status;
    const period = this.periodWhere(query);
    if (period) where.createdAt = period;
    return where;
  }

  private adminSettlementWhere(query: SettlementQueryDto | FinancePeriodQueryDto): Prisma.SellerSettlementWhereInput {
    const typed = query as SettlementQueryDto;
    const where: Prisma.SellerSettlementWhereInput = {};
    if (typed.sellerId) where.sellerId = typed.sellerId;
    if (typed.storeId) where.storeId = typed.storeId;
    if (typed.status) where.status = typed.status;
    const period = this.periodWhere(query);
    if (period) where.periodStart = period;
    return where;
  }

  private periodWhere(query: FinancePeriodQueryDto): Prisma.DateTimeFilter | undefined {
    if (!query.from && !query.to) return undefined;
    const filter: Prisma.DateTimeFilter = {};
    if (query.from) filter.gte = new Date(query.from);
    if (query.to) filter.lte = new Date(query.to);
    return filter;
  }

  private async topProducts(where: Prisma.CommissionRecordWhereInput) {
    const rows = await this.prisma.commissionRecord.groupBy({
      by: ['orderItemId'],
      where,
      _sum: { grossAmountCents: true },
      _count: { orderItemId: true },
      orderBy: { _sum: { grossAmountCents: 'desc' } },
      take: 5,
    });
    const items = await this.prisma.orderItem.findMany({
      where: { id: { in: rows.map((row) => row.orderItemId) } },
      select: { id: true, productId: true, nameSnapshot: true, quantity: true },
    });
    const itemById = new Map(items.map((item) => [item.id, item]));
    return rows.map((row) => ({
      productId: itemById.get(row.orderItemId)?.productId,
      name: itemById.get(row.orderItemId)?.nameSnapshot,
      grossSalesCents: row._sum.grossAmountCents ?? 0,
      commissionRecordCount: row._count.orderItemId,
    }));
  }

  private resolveCommissionRateBps(snapshot: Prisma.Decimal): number {
    const percent = snapshot.toNumber();
    if (percent > 0) return Math.round(percent * 100);
    return this.configService.get<number>('PLATFORM_DEFAULT_COMMISSION_BPS') ?? 1000;
  }

  private isCapturedPayment(status?: PaymentStatus, eventType?: PaymentEventType): boolean {
    return status === PaymentStatus.CAPTURED || status === PaymentStatus.SUCCESS || eventType === PaymentEventType.CAPTURED;
  }

  private createSettlementNumber(sellerId: string, storeId: string, start: Date, end: Date): string {
    const startKey = start.toISOString().slice(0, 10).replace(/-/g, '');
    const endKey = end.toISOString().slice(0, 10).replace(/-/g, '');
    return `SET-${sellerId.slice(-6).toUpperCase()}-${storeId.slice(-6).toUpperCase()}-${startKey}-${endKey}`;
  }

  private notifySeller(userId: string, subject: string, body: string, metadata: Record<string, unknown>) {
    const type = subject.includes('reversed')
      ? NotificationType.SELLER_COMMISSION_REVERSED
      : subject.includes('failed')
        ? NotificationType.SELLER_SETTLEMENT_FAILED
        : subject.includes('paid')
          ? NotificationType.SELLER_SETTLEMENT_PAID
          : NotificationType.SELLER_SETTLEMENT_GENERATED;
    const metadataId =
      typeof metadata.commissionId === 'string'
        ? metadata.commissionId
        : typeof metadata.settlementId === 'string'
          ? metadata.settlementId
          : String(Date.now());
    return this.notificationsService.createFromEvent({
      userId,
      type,
      idempotencyKey: `finance:${type}:${userId}:${metadataId}`,
      template: { status: body },
      metadata: JSON.parse(JSON.stringify(metadata)) as Prisma.InputJsonValue,
    });
  }
}

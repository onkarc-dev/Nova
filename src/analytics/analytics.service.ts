import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  adminRevenue() {
    return this.revenue();
  }

  async sellerRevenue(user: AuthUser) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id }, select: { id: true } });
    return this.revenue(seller?.id);
  }

  async categories() {
    const rows = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { totalCents: true, quantity: true },
      orderBy: { _sum: { totalCents: 'desc' } },
      take: 50,
    });
    const products = await this.prisma.product.findMany({
      where: { id: { in: rows.map((row) => row.productId) } },
      include: { category: true },
    });
    return rows.map((row) => {
      const product = products.find((item) => item.id === row.productId);
      return { category: product?.category.name ?? 'Unknown', revenueCents: row._sum.totalCents ?? 0, quantity: row._sum.quantity ?? 0 };
    });
  }

  adminProducts() {
    return this.products();
  }

  async sellerProducts(user: AuthUser) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id }, select: { id: true } });
    return this.products(seller?.id);
  }

  private async revenue(sellerId?: string) {
    const where = sellerId ? { items: { some: { sellerId } } } : {};
    const [orders, payments, returns] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.payment.aggregate({
        where: { status: { in: [PaymentStatus.CAPTURED, PaymentStatus.SUCCESS] }, order: where },
        _sum: { amountCents: true },
        _count: true,
      }),
      this.prisma.return.count({ where: { order: where } }),
    ]);
    return { revenueCents: payments._sum.amountCents ?? 0, orderCount: orders, paidPaymentCount: payments._count, returnCount: returns };
  }

  private products(sellerId?: string) {
    const args: Parameters<typeof this.prisma.orderItem.groupBy>[0] = {
      by: ['productId', 'sellerId'],
      ...(sellerId ? { where: { sellerId } } : {}),
      _sum: { totalCents: true, quantity: true },
      orderBy: { _sum: { totalCents: 'desc' } },
      take: 50,
    };
    return this.prisma.orderItem.groupBy(args);
  }
}

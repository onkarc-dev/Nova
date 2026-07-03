import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { PrismaService } from '@database/prisma.service';

export type OrderDto = Prisma.OrderGetPayload<{ include: ReturnType<OrdersService['orderInclude']> }>;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async listOrders(user: AuthUser): Promise<OrderDto[]> {
    return this.prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { placedAt: 'desc' },
      include: this.orderInclude(),
    });
  }

  async getOrder(user: AuthUser, orderId: string): Promise<OrderDto> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
      include: this.orderInclude(),
    });

    if (!order) throw new NotFoundException('Order not found.');
    return order;
  }

  private orderInclude() {
    return {
      shippingAddress: true,
      billingAddress: true,
      items: {
        orderBy: { id: 'asc' as const },
        include: {
          product: { include: { images: { orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }], take: 1 } } },
          variant: true,
          store: { select: { id: true, name: true, slug: true } },
        },
      },
    } satisfies Prisma.OrderInclude;
  }
}

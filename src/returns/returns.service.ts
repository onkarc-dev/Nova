import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { PrismaService } from '@database/prisma.service';
import type { CreateReturnDto, RejectReturnDto } from './dto/return.dto';

@Injectable()
export class ReturnsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreateReturnDto) {
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, userId: user.id },
      include: { returns: true },
    });
    if (!order) throw new NotFoundException('Order not found.');
    if (order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CONFIRMED && order.status !== OrderStatus.PAID) {
      throw new BadRequestException('This order is not eligible for return or exchange.');
    }
    if (order.returns.some((item) => ['REQUESTED', 'APPROVED', 'REFUNDED'].includes(item.status))) {
      throw new BadRequestException('An active return already exists for this order.');
    }
    return this.prisma.return.create({
      data: { orderId: order.id, reason: `[${dto.type}] ${dto.reason}`, status: 'REQUESTED' },
      include: { order: { include: { items: true } } },
    });
  }

  list(user: AuthUser) {
    if (user.roles.includes('admin')) {
      return this.prisma.return.findMany({ orderBy: { createdAt: 'desc' }, include: { order: { include: { items: true } } } });
    }
    if (user.roles.includes('seller')) {
      return this.prisma.return.findMany({
        where: { order: { items: { some: { seller: { userId: user.id } } } } },
        orderBy: { createdAt: 'desc' },
        include: { order: { include: { items: true } } },
      });
    }
    return this.prisma.return.findMany({
      where: { order: { userId: user.id } },
      orderBy: { createdAt: 'desc' },
      include: { order: { include: { items: true } } },
    });
  }

  async get(user: AuthUser, returnId: string) {
    const item = await this.prisma.return.findUnique({
      where: { id: returnId },
      include: { order: { include: { items: { include: { seller: true } } } } },
    });
    if (!item) throw new NotFoundException('Return request not found.');
    const canRead =
      user.roles.includes('admin') ||
      item.order.userId === user.id ||
      (user.roles.includes('seller') && item.order.items.some((orderItem) => orderItem.seller.userId === user.id));
    if (!canRead) throw new ForbiddenException('Return request is not available to this user.');
    return item;
  }

  approve(returnId: string) {
    return this.updateStatus(returnId, 'APPROVED');
  }

  reject(returnId: string, dto: RejectReturnDto) {
    return this.updateStatus(returnId, 'REJECTED', dto.reason);
  }

  async refund(returnId: string) {
    return this.prisma.runInTransaction(async (tx) => {
      const item = await tx.return.findUnique({ where: { id: returnId }, include: { order: { include: { payments: true } } } });
      if (!item) throw new NotFoundException('Return request not found.');
      if (item.status !== 'APPROVED') throw new BadRequestException('Only approved returns can be refunded.');
      const payment = item.order.payments.find((candidate) => candidate.status === PaymentStatus.CAPTURED || candidate.status === PaymentStatus.SUCCESS);
      if (!payment) throw new BadRequestException('No captured payment is available for refund.');
      await tx.refund.create({
        data: { orderId: item.orderId, paymentId: payment.id, returnId: item.id, amountCents: payment.amountCents, reason: item.reason, status: 'PENDING' },
      });
      return tx.return.update({ where: { id: item.id }, data: { status: 'REFUNDED' } });
    });
  }

  private async updateStatus(returnId: string, status: string, reason?: string) {
    const item = await this.prisma.return.findUnique({ where: { id: returnId } });
    if (!item) throw new NotFoundException('Return request not found.');
    return this.prisma.return.update({
      where: { id: item.id },
      data: { status, reason: reason ? `${item.reason}\nAdmin note: ${reason}` : item.reason },
    });
  }
}

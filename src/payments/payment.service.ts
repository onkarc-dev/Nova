import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { InventoryReservationService } from '@/inventory/inventory-reservation.service';
import { PrismaService } from '@database/prisma.service';
import { ManualPendingProvider } from './manual-pending.provider';
import { RazorpayProvider } from './razorpay.provider';
import type { CreatePendingPaymentInput } from './payment-provider.interface';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly manualProvider: ManualPendingProvider,
    private readonly razorpayProvider: RazorpayProvider,
    private readonly inventoryReservationService: InventoryReservationService,
  ) {}

  createPendingPayment(tx: Prisma.TransactionClient, input: CreatePendingPaymentInput) {
    const provider = this.razorpayProvider.isConfigured() ? this.razorpayProvider : this.manualProvider;
    return provider.createPendingPayment(tx, input);
  }

  async createForOrder(user: AuthUser, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!order) throw new NotFoundException('Order not found.');
    const payment = order.payments[0] ?? (await this.createPendingPayment(this.prisma, { orderId: order.id, amountCents: order.totalCents, currency: order.currency }));
    return { payment, razorpayKeyId: this.razorpayProvider.getPublicKey() ?? null };
  }

  verify(paymentId: string, providerRef?: string) {
    return this.markPaymentSuccess(paymentId, providerRef ?? `manual_${paymentId}`);
  }

  async refund(user: AuthUser, paymentId: string) {
    if (!user.roles.includes('admin')) throw new BadRequestException('Only admins can refund payments.');
    return this.prisma.runInTransaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id: paymentId }, include: { order: true } });
      if (!payment) throw new NotFoundException('Payment not found.');
      await tx.refund.create({
        data: { orderId: payment.orderId, paymentId: payment.id, amountCents: payment.amountCents, status: 'PENDING', reason: 'Admin refund' },
      });
      return tx.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.REFUNDED } });
    });
  }

  async handleRazorpayWebhook(rawBody: string, signature: string | undefined, body: { event?: string; payload?: unknown }) {
    if (!this.razorpayProvider.verifyWebhookSignature(rawBody, signature)) {
      throw new BadRequestException('Invalid Razorpay webhook signature.');
    }
    const paymentId = this.readNestedString(body.payload, ['payment', 'entity', 'notes', 'paymentId'])
      ?? this.readNestedString(body.payload, ['payment', 'entity', 'id']);
    const providerRef = this.readNestedString(body.payload, ['payment', 'entity', 'id']);
    if (!paymentId) throw new BadRequestException('Webhook payload is missing a payment reference.');
    if (body.event === 'payment.captured' || body.event === 'order.paid') {
      return this.markPaymentSuccess(paymentId, providerRef);
    }
    if (body.event === 'payment.failed') {
      return this.markPaymentFailed(paymentId, providerRef);
    }
    return { ignored: true, event: body.event ?? 'unknown' };
  }

  async markPaymentSuccess(paymentId: string, providerRef?: string) {
    return this.prisma.runInTransaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id: paymentId }, include: { order: true } });
      if (!payment) throw new NotFoundException('Payment not found.');
      if (payment.status === PaymentStatus.SUCCESS || payment.status === PaymentStatus.CAPTURED) return payment;

      const updated = await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.CAPTURED, providerRef: providerRef ?? null },
      });
      await tx.transaction.create({
        data: { paymentId: payment.id, type: 'CAPTURE', status: PaymentStatus.CAPTURED, amountCents: payment.amountCents, providerRef: providerRef ?? null },
      });
      await tx.order.update({ where: { id: payment.orderId }, data: { status: OrderStatus.CONFIRMED } });
      await this.inventoryReservationService.deductOrderItems(tx, payment.orderId);
      return updated;
    });
  }

  async markPaymentFailed(paymentId: string, providerRef?: string) {
    return this.prisma.runInTransaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id: paymentId } });
      if (!payment) throw new NotFoundException('Payment not found.');
      if (payment.status === PaymentStatus.FAILED) return payment;
      await this.inventoryReservationService.releaseOrderItems(tx, payment.orderId);
      await tx.transaction.create({
        data: { paymentId: payment.id, type: 'FAILURE', status: PaymentStatus.FAILED, amountCents: payment.amountCents, providerRef: providerRef ?? null },
      });
      await tx.order.update({ where: { id: payment.orderId }, data: { status: OrderStatus.PENDING_PAYMENT } });
      return tx.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.FAILED, providerRef: providerRef ?? null } });
    });
  }

  private readNestedString(source: unknown, path: string[]): string | undefined {
    let current: unknown = source;
    for (const key of path) {
      if (!current || typeof current !== 'object' || !(key in current)) return undefined;
      current = (current as Record<string, unknown>)[key];
    }
    return typeof current === 'string' ? current : undefined;
  }
}

import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentEventType, PaymentProvider, PaymentStatus, Prisma, RefundStatus, WebhookEventStatus } from '@prisma/client';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { InventoryReservationService } from '@/inventory/inventory-reservation.service';
import { PrismaService } from '@database/prisma.service';
import { ManualPendingProvider } from './manual-pending.provider';
import type { CreatePendingPaymentInput, PaymentProviderAdapter } from './payment-provider.interface';
import { PaymentStateMachine } from './payment-state-machine';
import { RazorpayProvider } from './razorpay.provider';
import type { ListPaymentsDto, RefundPaymentDto, VerifyPaymentDto } from './dto/payment.dto';

interface RazorpayWebhookBody {
  id?: string;
  event?: string;
  payload?: unknown;
}

@Injectable()
export class PaymentService {
  private readonly stateMachine = new PaymentStateMachine();

  constructor(
    private readonly prisma: PrismaService,
    private readonly manualProvider: ManualPendingProvider,
    private readonly razorpayProvider: RazorpayProvider,
    private readonly inventoryReservationService: InventoryReservationService,
  ) {}

  async createPendingPayment(tx: Prisma.TransactionClient, input: CreatePendingPaymentInput) {
    const provider = this.getCreateProvider();
    const payment = await provider.createOrder(tx, {
      ...input,
      receipt: input.receipt ?? input.orderId,
      notes: { paymentOrderId: input.orderId, ...(input.notes ?? {}) },
    });
    await this.recordAudit(tx, payment.id, PaymentEventType.CREATED, 'Payment created.', { provider: payment.provider });
    return payment;
  }

  async createForOrder(user: AuthUser, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!order) throw new NotFoundException('Order not found.');

    const reusableStatuses = new Set<PaymentStatus>([PaymentStatus.CREATED, PaymentStatus.PENDING, PaymentStatus.AUTHORIZED]);
    const reusablePayment = order.payments.find((payment) => reusableStatuses.has(payment.status));
    const payment = reusablePayment
      ?? await this.prisma.runInTransaction(async (tx) => {
        return this.createPendingPayment(tx, { orderId: order.id, amountCents: order.totalCents, currency: order.currency });
      });

    return { payment, razorpayKeyId: this.razorpayProvider.getPublicKey() ?? null };
  }

  async verify(dto: VerifyPaymentDto) {
    const payment = await this.prisma.payment.findUnique({ where: { id: dto.paymentId } });
    if (!payment) throw new NotFoundException('Payment not found.');
    if (!payment.providerOrderId || payment.providerOrderId !== dto.providerOrderId) {
      throw new BadRequestException('Payment order reference does not match.');
    }

    const provider = this.getProvider(payment.provider);
    const verification = await provider.verifyPayment({
      providerOrderId: dto.providerOrderId,
      providerPaymentId: dto.providerPaymentId,
      signature: dto.signature,
    });
    if (!verification.verified) throw new BadRequestException('Payment verification failed.');

    return this.applyCapturedPayment(payment.id, dto.providerPaymentId, `verify:${payment.provider}:${dto.providerPaymentId}`, verification.rawResponse);
  }

  async getStatus(user: AuthUser, paymentId: string) {
    const where: Prisma.PaymentWhereInput = { id: paymentId };
    if (!user.roles.includes('admin')) {
      where.order = { userId: user.id };
    }
    const payment = await this.prisma.payment.findFirst({
      where,
      include: { refunds: { orderBy: { createdAt: 'desc' } }, transactions: { orderBy: { createdAt: 'desc' } } },
    });
    if (!payment) throw new NotFoundException('Payment not found.');
    return payment;
  }

  async refund(user: AuthUser, paymentId: string, dto: RefundPaymentDto) {
    if (!user.roles.includes('admin')) throw new BadRequestException('Only admins can refund payments.');
    return this.prisma.runInTransaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id: paymentId }, include: { order: true } });
      if (!payment) throw new NotFoundException('Payment not found.');
      const refundableStatuses = new Set<PaymentStatus>([PaymentStatus.CAPTURED, PaymentStatus.PARTIALLY_REFUNDED]);
      if (!refundableStatuses.has(payment.status)) {
        throw new ConflictException('Only captured payments can be refunded.');
      }

      const remainingCents = payment.amountCents - payment.refundedCents;
      if (dto.amountCents > remainingCents) throw new BadRequestException('Refund amount exceeds captured balance.');

      const idempotencyKey = dto.idempotencyKey ?? `refund:${payment.id}:${String(dto.amountCents)}:${dto.reason ?? ''}`;
      const existingRefund = await tx.refund.findUnique({ where: { idempotencyKey } });
      if (existingRefund) return existingRefund;

      const refund = await tx.refund.create({
        data: {
          orderId: payment.orderId,
          paymentId: payment.id,
          amountCents: dto.amountCents,
          reason: dto.reason ?? 'Admin refund',
          status: RefundStatus.REQUESTED,
          idempotencyKey,
        },
      });
      await this.recordAudit(tx, payment.id, PaymentEventType.REFUND_REQUESTED, 'Refund requested.', { amountCents: dto.amountCents, refundId: refund.id });

      const provider = this.getProvider(payment.provider);
      const providerResult = await provider.refundPayment({
        providerPaymentId: payment.providerPaymentId ?? payment.providerRef ?? payment.id,
        amountCents: dto.amountCents,
        currency: payment.currency,
        refundId: refund.id,
        notes: { paymentId: payment.id, orderId: payment.orderId },
      });

      const newRefundedCents = payment.refundedCents + dto.amountCents;
      const newPaymentStatus = newRefundedCents >= payment.amountCents ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED;
      this.stateMachine.assertTransition(payment.status, newPaymentStatus);

      const refundUpdateData: Prisma.RefundUpdateInput = {
        status: providerResult.status === PaymentStatus.FAILED ? RefundStatus.FAILED : RefundStatus.PROCESSED,
        providerRef: providerResult.providerRef,
        processedAt: providerResult.status === PaymentStatus.FAILED ? null : new Date(),
      };
      if (providerResult.rawResponse !== undefined) {
        refundUpdateData.rawResponse = providerResult.rawResponse;
      }
      await tx.refund.update({
        where: { id: refund.id },
        data: refundUpdateData,
      });
      await tx.payment.update({ where: { id: payment.id }, data: { status: newPaymentStatus, refundedCents: newRefundedCents } });
      const refundTransactionData: Prisma.TransactionUncheckedCreateInput = {
        paymentId: payment.id,
        type: 'REFUND',
        status: newPaymentStatus,
        amountCents: dto.amountCents,
        providerRef: providerResult.providerRef,
        idempotencyKey,
      };
      if (providerResult.rawResponse !== undefined) {
        refundTransactionData.rawResponse = providerResult.rawResponse;
      }
      await tx.transaction.create({
        data: refundTransactionData,
      });
      await this.recordAudit(tx, payment.id, PaymentEventType.REFUND_PROCESSED, 'Refund processed.', { amountCents: dto.amountCents, refundId: refund.id });

      const updated = await tx.payment.findUnique({ where: { id: payment.id }, include: { refunds: true } });
      if (!updated) throw new NotFoundException('Payment not found.');
      return updated;
    });
  }

  async handleRazorpayWebhook(rawBody: string, signature: string | undefined, body: RazorpayWebhookBody) {
    if (!this.razorpayProvider.verifyWebhookSignature(rawBody, signature)) {
      await this.prisma.paymentAuditEvent.create({
        data: { type: PaymentEventType.INVALID_WEBHOOK_REJECTED, message: 'Invalid Razorpay webhook signature.', metadata: { event: body.event ?? 'unknown' } },
      });
      throw new BadRequestException('Invalid Razorpay webhook signature.');
    }

    const eventType = body.event ?? 'unknown';
    const eventId = body.id ?? this.readNestedString(body.payload, ['payment', 'entity', 'id']) ?? `${eventType}:${String(rawBody.length)}`;
    const idempotencyKey = `webhook:${PaymentProvider.RAZORPAY}:${eventId}`;

    try {
      return await this.prisma.runInTransaction(async (tx) => {
        const webhook = await tx.webhookEvent.create({
          data: {
            provider: PaymentProvider.RAZORPAY,
            eventId,
            eventType,
            idempotencyKey,
            payload: this.toJsonObject(body),
          },
        });

        const result = await this.applyWebhookEvent(tx, webhook.id, eventType, body.payload);
        await tx.webhookEvent.update({
          where: { id: webhook.id },
          data: { status: WebhookEventStatus.PROCESSED, paymentId: result.paymentId, processedAt: new Date() },
        });
        return result;
      });
    } catch (error) {
      if (this.isUniqueConstraint(error)) {
        await this.prisma.paymentAuditEvent.create({
          data: { type: PaymentEventType.DUPLICATE_WEBHOOK_IGNORED, message: 'Duplicate Razorpay webhook ignored.', metadata: { eventId, eventType } },
        });
        return { duplicate: true, eventId, eventType };
      }
      throw error;
    }
  }

  async expirePendingPayments(limit = 100) {
    const now = new Date();
    const payments = await this.prisma.payment.findMany({
      where: {
        status: { in: [PaymentStatus.CREATED, PaymentStatus.PENDING, PaymentStatus.AUTHORIZED] },
        expiresAt: { lt: now },
      },
      orderBy: { expiresAt: 'asc' },
      take: limit,
    });

    const expired: string[] = [];
    for (const payment of payments) {
      await this.prisma.runInTransaction(async (tx) => {
        const current = await tx.payment.findUnique({ where: { id: payment.id } });
        if (!current || !this.stateMachine.canTransition(current.status, PaymentStatus.EXPIRED)) return;
        await this.inventoryReservationService.releaseOrderItems(tx, current.orderId);
        await tx.payment.update({ where: { id: current.id }, data: { status: PaymentStatus.EXPIRED } });
        await tx.order.update({ where: { id: current.orderId }, data: { status: OrderStatus.PENDING_PAYMENT } });
        await tx.transaction.create({
          data: {
            paymentId: current.id,
            type: 'EXPIRE',
            status: PaymentStatus.EXPIRED,
            amountCents: current.amountCents,
            idempotencyKey: `expire:${current.id}`,
          },
        });
        await this.recordAudit(tx, current.id, PaymentEventType.EXPIRED, 'Payment expired and reserved inventory was released.');
        expired.push(current.id);
      });
    }
    return { expiredCount: expired.length, paymentIds: expired };
  }

  listAdminPayments(query: ListPaymentsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const where: Prisma.PaymentWhereInput = {};
    const status = this.parsePaymentStatus(query.status);
    const provider = this.parsePaymentProvider(query.provider);
    if (status) where.status = status;
    if (provider) where.provider = provider;
    return this.prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { order: { select: { id: true, orderNumber: true, userId: true, status: true, totalCents: true } }, refunds: true },
    });
  }

  getAdminPayment(paymentId: string) {
    return this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true, refunds: true, transactions: { orderBy: { createdAt: 'desc' } }, auditEvents: { orderBy: { createdAt: 'desc' } } },
    });
  }

  listAdminRefunds() {
    return this.prisma.refund.findMany({ orderBy: { createdAt: 'desc' }, include: { payment: true, order: true } });
  }

  async markPaymentSuccess(paymentId: string, providerRef?: string) {
    return this.applyCapturedPayment(paymentId, providerRef ?? `manual_${paymentId}`, `manual-capture:${paymentId}`);
  }

  async markPaymentFailed(paymentId: string, providerRef?: string) {
    return this.applyFailedPayment(paymentId, providerRef, `manual-failure:${paymentId}`);
  }

  private async applyWebhookEvent(tx: Prisma.TransactionClient, webhookId: string, eventType: string, payload: unknown) {
    const providerPaymentId = this.readNestedString(payload, ['payment', 'entity', 'id']);
    const providerOrderId = this.readNestedString(payload, ['payment', 'entity', 'order_id']);
    const payment = await this.findPaymentFromPayload(tx, payload, providerPaymentId, providerOrderId);
    if (!payment) throw new BadRequestException('Webhook payload is missing a known payment reference.');

    if (eventType === 'payment.authorized') {
      const updateData: Prisma.PaymentUpdateInput = {
        authorizedAt: new Date(),
      };
      if (providerPaymentId) updateData.providerPaymentId = providerPaymentId;
      const updated = await this.transitionPayment(tx, payment.id, PaymentStatus.AUTHORIZED, updateData);
      await this.recordAudit(tx, payment.id, PaymentEventType.AUTHORIZED, 'Payment authorized by Razorpay.', { webhookId });
      return { paymentId: updated.id, status: updated.status };
    }

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const updated = await this.applyCapturedPaymentInTransaction(tx, payment.id, providerPaymentId, `webhook:${webhookId}`, this.toJsonValue(payload));
      return { paymentId: updated.id, status: updated.status };
    }

    if (eventType === 'payment.failed') {
      const updated = await this.applyFailedPaymentInTransaction(tx, payment.id, providerPaymentId, `webhook:${webhookId}`, this.toJsonValue(payload));
      return { paymentId: updated.id, status: updated.status };
    }

    if (eventType === 'refund.processed') {
      const refundRef = this.readNestedString(payload, ['refund', 'entity', 'id']);
      await this.recordAudit(tx, payment.id, PaymentEventType.REFUND_PROCESSED, 'Refund processed webhook received.', { refundRef, webhookId });
      return { paymentId: payment.id, status: payment.status, ignored: false };
    }

    return { paymentId: payment.id, status: payment.status, ignored: true, eventType };
  }

  private async applyCapturedPayment(paymentId: string, providerPaymentId: string, idempotencyKey: string, rawResponse?: Prisma.InputJsonValue) {
    return this.prisma.runInTransaction((tx) => this.applyCapturedPaymentInTransaction(tx, paymentId, providerPaymentId, idempotencyKey, rawResponse));
  }

  private async applyCapturedPaymentInTransaction(
    tx: Prisma.TransactionClient,
    paymentId: string,
    providerPaymentId: string | undefined,
    idempotencyKey: string,
    rawResponse?: Prisma.InputJsonValue,
  ) {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found.');
    const capturedStatuses = new Set<PaymentStatus>([PaymentStatus.CAPTURED, PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED]);
    if (capturedStatuses.has(payment.status)) return payment;
    this.stateMachine.assertTransition(payment.status, PaymentStatus.CAPTURED);

    const updated = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.CAPTURED,
        providerPaymentId: providerPaymentId ?? payment.providerPaymentId,
        providerRef: providerPaymentId ?? payment.providerRef,
        capturedAt: new Date(),
      },
    });
    const captureTransactionData: Prisma.TransactionUncheckedCreateInput = {
      paymentId: payment.id,
      type: 'CAPTURE',
      status: PaymentStatus.CAPTURED,
      amountCents: payment.amountCents,
      providerRef: providerPaymentId ?? null,
      idempotencyKey,
    };
    if (rawResponse !== undefined) captureTransactionData.rawResponse = rawResponse;
    await tx.transaction.create({ data: captureTransactionData });
    await tx.order.update({ where: { id: payment.orderId }, data: { status: OrderStatus.CONFIRMED } });
    await this.inventoryReservationService.deductOrderItems(tx, payment.orderId);
    await this.recordAudit(tx, payment.id, PaymentEventType.CAPTURED, 'Payment captured and inventory deducted.', { providerPaymentId });
    return updated;
  }

  private async applyFailedPayment(paymentId: string, providerRef: string | undefined, idempotencyKey: string) {
    return this.prisma.runInTransaction((tx) => this.applyFailedPaymentInTransaction(tx, paymentId, providerRef, idempotencyKey));
  }

  private async applyFailedPaymentInTransaction(
    tx: Prisma.TransactionClient,
    paymentId: string,
    providerRef: string | undefined,
    idempotencyKey: string,
    rawResponse?: Prisma.InputJsonValue,
  ) {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found.');
    if (payment.status === PaymentStatus.FAILED) return payment;
    this.stateMachine.assertTransition(payment.status, PaymentStatus.FAILED);

    await this.inventoryReservationService.releaseOrderItems(tx, payment.orderId);
    const failureTransactionData: Prisma.TransactionUncheckedCreateInput = {
      paymentId: payment.id,
      type: 'FAILURE',
      status: PaymentStatus.FAILED,
      amountCents: payment.amountCents,
      providerRef: providerRef ?? null,
      idempotencyKey,
    };
    if (rawResponse !== undefined) failureTransactionData.rawResponse = rawResponse;
    await tx.transaction.create({ data: failureTransactionData });
    await tx.order.update({ where: { id: payment.orderId }, data: { status: OrderStatus.PENDING_PAYMENT } });
    const updated = await tx.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED, providerPaymentId: providerRef ?? payment.providerPaymentId, providerRef: providerRef ?? payment.providerRef, failedAt: new Date() },
    });
    await this.recordAudit(tx, payment.id, PaymentEventType.FAILED, 'Payment failed and reserved inventory was released.', { providerRef });
    return updated;
  }

  private async transitionPayment(tx: Prisma.TransactionClient, paymentId: string, status: PaymentStatus, data: Prisma.PaymentUpdateInput = {}) {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found.');
    if (payment.status === status) return payment;
    this.stateMachine.assertTransition(payment.status, status);
    return tx.payment.update({ where: { id: paymentId }, data: { ...data, status } });
  }

  private async findPaymentFromPayload(
    tx: Prisma.TransactionClient,
    payload: unknown,
    providerPaymentId: string | undefined,
    providerOrderId: string | undefined,
  ) {
    const internalPaymentId = this.readNestedString(payload, ['payment', 'entity', 'notes', 'paymentId']);
    if (internalPaymentId) {
      const payment = await tx.payment.findUnique({ where: { id: internalPaymentId } });
      if (payment) return payment;
    }
    if (providerPaymentId) {
      const payment = await tx.payment.findFirst({ where: { providerPaymentId } });
      if (payment) return payment;
    }
    if (providerOrderId) {
      return tx.payment.findFirst({ where: { provider: PaymentProvider.RAZORPAY, providerOrderId } });
    }
    return null;
  }

  private async recordAudit(
    tx: Prisma.TransactionClient,
    paymentId: string | null,
    type: PaymentEventType,
    message: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    const data: Prisma.PaymentAuditEventUncheckedCreateInput = { paymentId, type, message };
    if (metadata !== undefined) data.metadata = metadata;
    return tx.paymentAuditEvent.create({ data });
  }

  private getCreateProvider(): PaymentProviderAdapter {
    return this.razorpayProvider.isConfigured() ? this.razorpayProvider : this.manualProvider;
  }

  private getProvider(provider: PaymentProvider): PaymentProviderAdapter {
    if (provider === PaymentProvider.RAZORPAY) return this.razorpayProvider;
    return this.manualProvider;
  }

  private parsePaymentStatus(status: string | undefined): PaymentStatus | undefined {
    return status && Object.values(PaymentStatus).includes(status as PaymentStatus) ? (status as PaymentStatus) : undefined;
  }

  private parsePaymentProvider(provider: string | undefined): PaymentProvider | undefined {
    return provider && Object.values(PaymentProvider).includes(provider as PaymentProvider) ? (provider as PaymentProvider) : undefined;
  }

  private readNestedString(source: unknown, path: string[]): string | undefined {
    let current: unknown = source;
    for (const key of path) {
      if (!current || typeof current !== 'object' || !(key in current)) return undefined;
      current = (current as Record<string, unknown>)[key];
    }
    return typeof current === 'string' ? current : undefined;
  }

  private isUniqueConstraint(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }

  private toJsonObject(value: unknown): Prisma.InputJsonObject {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject;
  }

  private toJsonValue(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}

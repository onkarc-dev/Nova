import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  NotificationType,
  Prisma,
  ProductStatus,
  RefundStatus,
  ShipmentStatus,
} from '@prisma/client';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { PrismaService } from '@database/prisma.service';
import { ConsoleNotificationProvider } from './notification-providers';
import { NotificationQueue } from './notification-queue';
import { NotificationTemplateService, type NotificationTemplateInput } from './notification-templates';
import type { ListNotificationsDto } from './dto/notification.dto';

interface NotificationEventInput {
  userId: string;
  type: NotificationType;
  idempotencyKey: string;
  template?: NotificationTemplateInput;
  metadata?: Prisma.InputJsonValue;
  channels?: NotificationChannel[];
  priority?: NotificationPriority;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly defaultChannels = [NotificationChannel.IN_APP, NotificationChannel.EMAIL];

  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: ConsoleNotificationProvider,
    private readonly templates: NotificationTemplateService,
    private readonly queue: NotificationQueue,
  ) {}

  async createFromEvent(input: NotificationEventInput) {
    return this.prisma.runInTransaction((tx) => this.createFromEventTx(tx, input));
  }

  async createFromEventTx(tx: Prisma.TransactionClient, input: NotificationEventInput) {
    const rendered = this.templates.render(input.type, input.template);
    const priority = input.priority ?? rendered.priority;
    const channels = input.channels ?? this.defaultChannels;
    const notifications = [];
    for (const channel of channels) {
      const notification = await this.createOne(tx, {
        ...input,
        idempotencyKey: `${input.idempotencyKey}:channel:${channel}`,
        channel,
        title: rendered.title,
        body: rendered.body,
        priority,
      });
      notifications.push(notification);
    }
    return notifications;
  }

  async safeCreateFromEvent(input: NotificationEventInput): Promise<void> {
    try {
      await this.createFromEvent(input);
    } catch (error) {
      this.logger.error(`Notification hook failed for ${input.idempotencyKey}.`, error instanceof Error ? error.stack : undefined);
    }
  }

  async notifyPaymentCaptured(paymentId: string): Promise<void> {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId }, include: { order: { include: { items: true } } } });
    if (!payment) return;
    await this.safeCreateFromEvent({
      userId: payment.order.userId,
      type: NotificationType.PAYMENT_SUCCESS,
      idempotencyKey: `payment:${payment.id}:captured:customer:${payment.order.userId}`,
      template: { orderNumber: payment.order.orderNumber, paymentId: payment.id, amountCents: payment.amountCents, currency: payment.currency },
      metadata: { paymentId: payment.id, orderId: payment.orderId },
    });
    const sellerIds = new Set(payment.order.items.map((item) => item.sellerId));
    for (const sellerId of sellerIds) {
      const seller = await this.prisma.seller.findUnique({ where: { id: sellerId } });
      if (!seller) continue;
      await this.safeCreateFromEvent({
        userId: seller.userId,
        type: NotificationType.SELLER_NEW_ORDER,
        idempotencyKey: `order:${payment.orderId}:paid:seller:${seller.id}`,
        template: { orderNumber: payment.order.orderNumber },
        metadata: { orderId: payment.orderId, sellerId: seller.id },
      });
    }
  }

  async notifyPaymentFailed(paymentId: string): Promise<void> {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId }, include: { order: true } });
    if (!payment) return;
    await this.safeCreateFromEvent({
      userId: payment.order.userId,
      type: NotificationType.PAYMENT_FAILED,
      idempotencyKey: `payment:${payment.id}:failed:customer:${payment.order.userId}`,
      template: { orderNumber: payment.order.orderNumber, paymentId: payment.id },
      metadata: { paymentId: payment.id, orderId: payment.orderId },
    });
    await this.notifyAdmins(NotificationType.ADMIN_PAYMENT_FAILED, `payment:${payment.id}:failed:admin`, { paymentId: payment.id }, { paymentId: payment.id, orderNumber: payment.order.orderNumber });
  }

  async notifyRefundProcessed(refundId: string): Promise<void> {
    const refund = await this.prisma.refund.findUnique({ where: { id: refundId }, include: { order: true } });
    if (refund?.status !== RefundStatus.PROCESSED) return;
    await this.safeCreateFromEvent({
      userId: refund.order.userId,
      type: NotificationType.REFUND_PROCESSED,
      idempotencyKey: `refund:${refund.id}:processed:customer:${refund.order.userId}`,
      template: { orderNumber: refund.order.orderNumber, amountCents: refund.amountCents, currency: refund.order.currency },
      metadata: { refundId: refund.id, orderId: refund.orderId },
    });
  }

  async notifyShipmentCreated(shipmentId: string): Promise<void> {
    await this.notifyShipmentStatus(shipmentId, NotificationType.SHIPMENT_CREATED, 'created');
  }

  async notifyShipmentStatus(shipmentId: string, type?: NotificationType, suffix?: string): Promise<void> {
    const shipment = await this.prisma.shipment.findUnique({ where: { id: shipmentId }, include: { order: true } });
    if (!shipment) return;
    const notificationType = type ?? this.typeForShipmentStatus(shipment.status);
    if (!notificationType) return;
    await this.safeCreateFromEvent({
      userId: shipment.order.userId,
      type: notificationType,
      idempotencyKey: `shipment:${shipment.id}:status:${suffix ?? shipment.status}:customer:${shipment.order.userId}`,
      template: { orderNumber: shipment.order.orderNumber, shipmentId: shipment.id, status: shipment.status },
      metadata: { shipmentId: shipment.id, orderId: shipment.orderId, status: shipment.status },
    });
  }

  async notifyReturnStatus(returnId: string, type: NotificationType): Promise<void> {
    const item = await this.prisma.return.findUnique({ where: { id: returnId }, include: { order: true } });
    if (!item) return;
    await this.safeCreateFromEvent({
      userId: item.order.userId,
      type,
      idempotencyKey: `return:${item.id}:status:${item.status}:customer:${item.order.userId}`,
      template: { orderNumber: item.order.orderNumber, returnId: item.id, status: item.status },
      metadata: { returnId: item.id, orderId: item.orderId, status: item.status },
    });
  }

  async notifyProductModeration(productId: string, status: ProductStatus): Promise<void> {
    const product = await this.prisma.product.findUnique({ where: { id: productId }, include: { store: { include: { seller: true } } } });
    if (!product) return;
    const type = status === ProductStatus.ACTIVE ? NotificationType.SELLER_PRODUCT_APPROVED : NotificationType.SELLER_PRODUCT_REJECTED;
    await this.safeCreateFromEvent({
      userId: product.store.seller.userId,
      type,
      idempotencyKey: `product:${product.id}:${status === ProductStatus.ACTIVE ? 'approved' : 'rejected'}:seller:${product.store.sellerId}`,
      template: { productName: product.name },
      metadata: { productId: product.id, sellerId: product.store.sellerId, status },
    });
  }

  async listForUser(user: AuthUser, query: ListNotificationsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.NotificationWhereInput = { userId: user.id };
    const status = this.parseStatus(query.status);
    if (status) where.status = status;
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: { attempts: { orderBy: { attemptedAt: 'desc' }, take: 3 } },
      }),
      this.prisma.notification.count({ where }),
    ]);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async unreadCount(user: AuthUser) {
    const count = await this.prisma.notification.count({ where: { userId: user.id, readAt: null } });
    return { count };
  }

  async markRead(user: AuthUser, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) throw new NotFoundException('Notification not found.');
    if (notification.userId !== user.id) throw new ForbiddenException('Notification is not available to this user.');
    return this.prisma.notification.update({ where: { id: notification.id }, data: { status: NotificationStatus.READ, readAt: new Date() } });
  }

  markAllRead(user: AuthUser) {
    return this.prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });
  }

  listAdmin(query: ListNotificationsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    return this.prisma.notification.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } }, attempts: { orderBy: { attemptedAt: 'desc' }, take: 3 } },
    });
  }

  listFailures() {
    return this.prisma.notification.findMany({
      where: { status: NotificationStatus.FAILED },
      orderBy: { failedAt: 'desc' },
      include: { attempts: { orderBy: { attemptedAt: 'desc' } }, user: { select: { id: true, email: true } } },
    });
  }

  async retry(notificationId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id: notificationId }, include: { user: true, attempts: true } });
    if (!notification) throw new NotFoundException('Notification not found.');
    if (notification.status !== NotificationStatus.FAILED) throw new ForbiddenException('Only failed notifications can be retried.');
    await this.prisma.notification.update({ where: { id: notification.id }, data: { status: NotificationStatus.PENDING, failedAt: null } });
    this.queue.enqueue({ notificationId: notification.id, priority: notification.priority, attempts: notification.attempts.length });
    return this.deliver(notification.id);
  }

  private async createOne(
    tx: Prisma.TransactionClient,
    input: NotificationEventInput & {
      channel: NotificationChannel;
      title: string;
      body: string;
      priority: NotificationPriority;
    },
  ) {
    try {
      const data: Prisma.NotificationUncheckedCreateInput = {
          userId: input.userId,
          type: input.type,
          channel: input.channel,
          title: input.title,
          body: input.body,
          priority: input.priority,
          idempotencyKey: input.idempotencyKey,
      };
      if (input.metadata !== undefined) data.metadata = input.metadata;
      const notification = await tx.notification.create({ data });
      this.queue.enqueue({ notificationId: notification.id, priority: notification.priority, attempts: 0 });
      await this.deliverPersisted(tx, notification.id);
      return notification;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await tx.notification.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
        if (existing) return existing;
      }
      throw error;
    }
  }

  private async deliver(notificationId: string) {
    return this.prisma.runInTransaction((tx) => this.deliverPersisted(tx, notificationId));
  }

  private async deliverPersisted(tx: Prisma.TransactionClient, notificationId: string) {
    const notification = await tx.notification.findUnique({ where: { id: notificationId }, include: { user: true } });
    if (!notification) throw new NotFoundException('Notification not found.');
    try {
      const result = notification.channel === NotificationChannel.EMAIL
        ? await this.provider.sendEmail({
            toUserId: notification.userId,
            toEmail: notification.user.email,
            channel: notification.channel,
            title: notification.title,
            body: notification.body,
            metadata: this.toRecord(notification.metadata),
          })
        : notification.channel === NotificationChannel.IN_APP
          ? await this.provider.sendInApp()
          : await this.provider.sendSms();

      const attemptData: Prisma.NotificationAttemptUncheckedCreateInput = {
        notificationId: notification.id,
        provider: result.provider,
        status: result.status,
      };
      if (result.metadata !== undefined) attemptData.metadata = this.toInputJson(result.metadata);
      await tx.notificationAttempt.create({ data: attemptData });
      return await tx.notification.update({
        where: { id: notification.id },
        data: result.status === NotificationStatus.SENT
          ? { status: NotificationStatus.SENT, sentAt: new Date(), failedAt: null }
          : { status: NotificationStatus.FAILED, failedAt: new Date() },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown notification provider error.';
      const attempt = await tx.notificationAttempt.create({
        data: { notificationId: notification.id, provider: this.provider.name, status: NotificationStatus.FAILED, errorMessage: message },
      });
      await tx.notification.update({ where: { id: notification.id }, data: { status: NotificationStatus.FAILED, failedAt: new Date() } });
      return attempt;
    }
  }

  private async notifyAdmins(type: NotificationType, keyPrefix: string, metadata: Prisma.InputJsonValue, template?: NotificationTemplateInput) {
    const admins = await this.prisma.user.findMany({ where: { roles: { some: { role: { name: 'admin' } } } }, select: { id: true } });
    for (const admin of admins) {
      const input: NotificationEventInput = {
        userId: admin.id,
        type,
        idempotencyKey: `${keyPrefix}:user:${admin.id}`,
        metadata,
        priority: NotificationPriority.CRITICAL,
      };
      if (template !== undefined) input.template = template;
      await this.safeCreateFromEvent(input);
    }
  }

  private typeForShipmentStatus(status: ShipmentStatus): NotificationType | undefined {
    const types: Partial<Record<ShipmentStatus, NotificationType>> = {
      [ShipmentStatus.SHIPPED]: NotificationType.SHIPMENT_SHIPPED,
      [ShipmentStatus.OUT_FOR_DELIVERY]: NotificationType.OUT_FOR_DELIVERY,
      [ShipmentStatus.DELIVERED]: NotificationType.DELIVERED,
      [ShipmentStatus.FAILED_DELIVERY]: NotificationType.FAILED_DELIVERY,
    };
    return types[status];
  }

  private parseStatus(status: string | undefined): NotificationStatus | undefined {
    return status && Object.values(NotificationStatus).includes(status as NotificationStatus) ? (status as NotificationStatus) : undefined;
  }

  private toRecord(value: Prisma.JsonValue | null): Record<string, unknown> | undefined {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : undefined;
  }

  private toInputJson(value: Record<string, unknown>): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}

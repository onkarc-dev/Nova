import { ForbiddenException } from '@nestjs/common';
import { NotificationChannel, NotificationPriority, NotificationStatus, NotificationType } from '@prisma/client';
import type { PrismaService } from '@database/prisma.service';
import type { ConsoleNotificationProvider } from './notification-providers';
import { NotificationQueue } from './notification-queue';
import { NotificationTemplateService } from './notification-templates';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  function createService() {
    const notification = {
      id: 'notification_1',
      userId: 'user_1',
      type: NotificationType.PAYMENT_SUCCESS,
      channel: NotificationChannel.IN_APP,
      title: 'Payment confirmed',
      body: 'Paid',
      status: NotificationStatus.SENT,
      priority: NotificationPriority.HIGH,
      idempotencyKey: 'payment:1:captured:customer:user_1:channel:IN_APP',
      metadata: null,
      readAt: null,
      sentAt: new Date(),
      failedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const tx = {
      notification: {
        create: jest.fn().mockResolvedValue(notification),
        findUnique: jest.fn().mockResolvedValue({ ...notification, user: { email: 'buyer@example.com' } }),
        update: jest.fn().mockResolvedValue(notification),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([notification]),
        count: jest.fn().mockResolvedValue(1),
      },
      notificationAttempt: {
        create: jest.fn().mockResolvedValue({ id: 'attempt_1' }),
      },
      user: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const prisma = {
      runInTransaction: jest.fn((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
      notification: tx.notification,
      notificationAttempt: tx.notificationAttempt,
      user: tx.user,
      payment: { findUnique: jest.fn() },
      seller: { findUnique: jest.fn() },
      shipment: { findUnique: jest.fn() },
      return: { findUnique: jest.fn() },
      product: { findUnique: jest.fn() },
      refund: { findUnique: jest.fn() },
    };
    const provider = {
      name: 'console-notification',
      sendEmail: jest.fn().mockResolvedValue({ provider: 'console-email', status: NotificationStatus.SENT }),
      sendInApp: jest.fn().mockResolvedValue({ provider: 'console-notification', status: NotificationStatus.SENT }),
      sendSms: jest.fn().mockResolvedValue({ provider: 'sms-placeholder', status: NotificationStatus.FAILED }),
    };
    const service = new NotificationsService(
      prisma as unknown as PrismaService,
      provider as unknown as ConsoleNotificationProvider,
      new NotificationTemplateService(),
      new NotificationQueue(),
    );
    return { notification, prisma, provider, service, tx };
  }

  it('creates in-app and email notifications with idempotency keys', async () => {
    const { service, tx } = createService();

    await service.createFromEvent({
      userId: 'user_1',
      type: NotificationType.PAYMENT_SUCCESS,
      idempotencyKey: 'payment:1:captured:customer:user_1',
      template: { orderNumber: 'NOVA-1' },
    });

    expect(tx.notification.create).toHaveBeenCalledTimes(2);
    expect(tx.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ idempotencyKey: 'payment:1:captured:customer:user_1:channel:IN_APP' }),
      }),
    );
  });

  it('counts unread notifications for the current user', async () => {
    const { service, tx } = createService();
    tx.notification.count.mockResolvedValueOnce(3);

    await expect(service.unreadCount({ id: 'user_1', email: 'buyer@example.com', roles: ['customer'] })).resolves.toEqual({ count: 3 });
    expect(tx.notification.count).toHaveBeenCalledWith({ where: { userId: 'user_1', readAt: null } });
  });

  it('prevents reading another user notification', async () => {
    const { service, tx } = createService();
    tx.notification.findUnique.mockResolvedValueOnce({ userId: 'user_2' });

    await expect(service.markRead({ id: 'user_1', email: 'buyer@example.com', roles: ['customer'] }, 'notification_1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('retries only failed notifications and records a new attempt', async () => {
    const { provider, service, tx } = createService();
    const failedEmailNotification = {
      id: 'notification_1',
      userId: 'user_1',
      channel: NotificationChannel.EMAIL,
      title: 'Payment failed',
      body: 'Try again',
      status: NotificationStatus.FAILED,
      priority: NotificationPriority.HIGH,
      metadata: null,
      attempts: [{ id: 'attempt_1' }],
      user: { email: 'buyer@example.com' },
    };
    tx.notification.findUnique.mockResolvedValueOnce(failedEmailNotification).mockResolvedValueOnce(failedEmailNotification);

    await service.retry('notification_1');

    expect(provider.sendEmail).toHaveBeenCalledTimes(1);
    expect(tx.notificationAttempt.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: NotificationStatus.SENT }) }));
  });
});

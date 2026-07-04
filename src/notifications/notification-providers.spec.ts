import type { ConfigService } from '@nestjs/config';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { AwsSesEmailProvider, ConsoleEmailProvider, ConsoleNotificationProvider, ResendEmailProvider } from './notification-providers';

describe('notification providers', () => {
  it('accepts console email delivery', async () => {
    const provider = new ConsoleEmailProvider();

    await expect(
      provider.sendEmail({
        toUserId: 'user_1',
        toEmail: 'buyer@example.com',
        channel: NotificationChannel.EMAIL,
        title: 'Payment confirmed',
        body: 'Paid',
      }),
    ).resolves.toEqual(expect.objectContaining({ provider: 'console-email', status: NotificationStatus.SENT }));
  });

  it('falls back to console email provider by default', async () => {
    const provider = new ConsoleNotificationProvider(
      { get: jest.fn().mockReturnValue('console') } as unknown as ConfigService,
      new ConsoleEmailProvider(),
      new ResendEmailProvider({ get: jest.fn() } as unknown as ConfigService),
      new AwsSesEmailProvider(),
    );

    await expect(
      provider.sendEmail({
        toUserId: 'user_1',
        toEmail: 'buyer@example.com',
        channel: NotificationChannel.EMAIL,
        title: 'Shipment shipped',
        body: 'On the way',
      }),
    ).resolves.toEqual(expect.objectContaining({ provider: 'console-email', status: NotificationStatus.SENT }));
  });
});

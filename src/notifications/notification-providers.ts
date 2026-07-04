import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationStatus } from '@prisma/client';
import type { EmailProvider, NotificationDeliveryResult, NotificationMessage, NotificationProvider } from './notification-provider.interface';

@Injectable()
export class ConsoleEmailProvider implements EmailProvider {
  readonly name = 'console-email';
  private readonly logger = new Logger(ConsoleEmailProvider.name);

  sendEmail(message: NotificationMessage): Promise<NotificationDeliveryResult> {
    this.logger.log({ to: message.toEmail ?? message.toUserId, subject: message.title, metadata: message.metadata }, 'Notification email accepted');
    return Promise.resolve({ provider: this.name, status: NotificationStatus.SENT, metadata: { mode: 'console' } });
  }
}

@Injectable()
export class ResendEmailProvider implements EmailProvider {
  readonly name = 'resend-email';
  private readonly logger = new Logger(ResendEmailProvider.name);

  constructor(private readonly config: ConfigService) {}

  sendEmail(message: NotificationMessage): Promise<NotificationDeliveryResult> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY is not configured; falling back to accepted no-op email.');
      return Promise.resolve({ provider: this.name, status: NotificationStatus.SENT, metadata: { configured: false } });
    }
    this.logger.warn({ to: message.toEmail ?? message.toUserId, subject: message.title }, 'Resend transport placeholder accepted email without external API call');
    return Promise.resolve({ provider: this.name, status: NotificationStatus.SENT, metadata: { configured: true, placeholder: true } });
  }
}

@Injectable()
export class AwsSesEmailProvider implements EmailProvider {
  readonly name = 'aws-ses-email';

  sendEmail(): Promise<NotificationDeliveryResult> {
    return Promise.resolve({ provider: this.name, status: NotificationStatus.SENT, metadata: { placeholder: true } });
  }
}

@Injectable()
export class ConsoleNotificationProvider implements NotificationProvider {
  readonly name = 'console-notification';

  constructor(
    private readonly config: ConfigService,
    private readonly consoleEmailProvider: ConsoleEmailProvider,
    private readonly resendEmailProvider: ResendEmailProvider,
    private readonly awsSesEmailProvider: AwsSesEmailProvider,
  ) {}

  sendEmail(message: NotificationMessage): Promise<NotificationDeliveryResult> {
    return this.selectEmailProvider().sendEmail(message);
  }

  sendInApp(): Promise<NotificationDeliveryResult> {
    return Promise.resolve({ provider: this.name, status: NotificationStatus.SENT, metadata: { persisted: true } });
  }

  sendSms(): Promise<NotificationDeliveryResult> {
    return Promise.resolve({ provider: 'sms-placeholder', status: NotificationStatus.FAILED, metadata: { configured: false } });
  }

  sendWebhook(): Promise<NotificationDeliveryResult> {
    return Promise.resolve({ provider: 'webhook-placeholder', status: NotificationStatus.FAILED, metadata: { configured: false } });
  }

  private selectEmailProvider(): EmailProvider {
    const provider = this.config.get<string>('EMAIL_PROVIDER') ?? process.env.EMAIL_PROVIDER ?? 'console';
    if (provider === 'resend') return this.resendEmailProvider;
    if (provider === 'aws-ses') return this.awsSesEmailProvider;
    return this.consoleEmailProvider;
  }
}

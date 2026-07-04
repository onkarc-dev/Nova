import type { Notification, NotificationAttempt, NotificationChannel, NotificationStatus } from '@prisma/client';

export interface NotificationMessage {
  toUserId: string;
  toEmail?: string | null;
  channel: NotificationChannel;
  title: string;
  body: string;
  metadata?: Record<string, unknown> | undefined;
}

export interface NotificationDeliveryResult {
  provider: string;
  status: NotificationStatus;
  metadata?: Record<string, unknown>;
}

export interface EmailProvider {
  readonly name: string;
  sendEmail(message: NotificationMessage): Promise<NotificationDeliveryResult>;
}

export interface NotificationProvider {
  readonly name: string;
  sendEmail(message: NotificationMessage): Promise<NotificationDeliveryResult>;
  sendInApp(notification: Notification): Promise<NotificationDeliveryResult>;
  sendSms?(message: NotificationMessage): Promise<NotificationDeliveryResult>;
  sendWebhook?(message: NotificationMessage): Promise<NotificationDeliveryResult>;
}

export interface NotificationDeliveryFailure {
  notification: Notification;
  attempt: NotificationAttempt;
}

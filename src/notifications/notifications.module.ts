import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { AdminNotificationsController, NotificationsController } from './notifications.controller';
import { NotificationQueue } from './notification-queue';
import { AwsSesEmailProvider, ConsoleEmailProvider, ConsoleNotificationProvider, ResendEmailProvider } from './notification-providers';
import { NotificationTemplateService } from './notification-templates';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [DatabaseModule],
  controllers: [NotificationsController, AdminNotificationsController],
  providers: [
    NotificationsService,
    NotificationTemplateService,
    NotificationQueue,
    ConsoleEmailProvider,
    ResendEmailProvider,
    AwsSesEmailProvider,
    ConsoleNotificationProvider,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}

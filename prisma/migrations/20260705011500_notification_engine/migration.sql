-- Notification Engine: transactional notifications, attempts, and idempotency.

CREATE TYPE "NotificationType" AS ENUM (
  'ORDER_PLACED',
  'PAYMENT_SUCCESS',
  'PAYMENT_FAILED',
  'REFUND_REQUESTED',
  'REFUND_PROCESSED',
  'SHIPMENT_CREATED',
  'SHIPMENT_SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'FAILED_DELIVERY',
  'RETURN_REQUESTED',
  'RETURN_APPROVED',
  'RETURN_REJECTED',
  'SELLER_NEW_ORDER',
  'SELLER_PRODUCT_APPROVED',
  'SELLER_PRODUCT_REJECTED',
  'ADMIN_PAYMENT_FAILED',
  'ADMIN_REFUND_ALERT'
);

CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');

ALTER TYPE "NotificationChannel" RENAME VALUE 'PUSH' TO 'WHATSAPP';
ALTER TYPE "NotificationStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

ALTER TABLE "Notification" RENAME COLUMN "subject" TO "title";

ALTER TABLE "Notification"
  ADD COLUMN "type" "NotificationType" NOT NULL DEFAULT 'ORDER_PLACED',
  ADD COLUMN "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "failedAt" TIMESTAMP(3),
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Notification"
SET "idempotencyKey" = concat('legacy:', "id")
WHERE "idempotencyKey" IS NULL;

ALTER TABLE "Notification" ALTER COLUMN "idempotencyKey" SET NOT NULL;
ALTER TABLE "Notification" ALTER COLUMN "type" DROP DEFAULT;

CREATE UNIQUE INDEX "Notification_idempotencyKey_key" ON "Notification"("idempotencyKey");
CREATE INDEX "Notification_userId_status_createdAt_idx" ON "Notification"("userId", "status", "createdAt");
CREATE INDEX "Notification_status_priority_createdAt_idx" ON "Notification"("status", "priority", "createdAt");
CREATE INDEX "Notification_type_createdAt_idx" ON "Notification"("type", "createdAt");

CREATE TABLE "NotificationAttempt" (
  "id" TEXT NOT NULL,
  "notificationId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "status" "NotificationStatus" NOT NULL,
  "errorMessage" TEXT,
  "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,

  CONSTRAINT "NotificationAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NotificationAttempt_notificationId_attemptedAt_idx" ON "NotificationAttempt"("notificationId", "attemptedAt");
CREATE INDEX "NotificationAttempt_status_attemptedAt_idx" ON "NotificationAttempt"("status", "attemptedAt");

ALTER TABLE "NotificationAttempt"
  ADD CONSTRAINT "NotificationAttempt_notificationId_fkey"
  FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Phase 3 production payment engine.

ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'CREATED';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

ALTER TYPE "PaymentProvider" ADD VALUE IF NOT EXISTS 'MANUAL_DEV';

CREATE TYPE "RefundStatus" AS ENUM ('REQUESTED', 'PROCESSING', 'PROCESSED', 'FAILED', 'CANCELLED');
CREATE TYPE "PaymentEventType" AS ENUM (
  'CREATED',
  'VERIFIED',
  'AUTHORIZED',
  'CAPTURED',
  'FAILED',
  'CANCELLED',
  'EXPIRED',
  'REFUND_REQUESTED',
  'REFUND_PROCESSED',
  'DUPLICATE_WEBHOOK_IGNORED',
  'INVALID_WEBHOOK_REJECTED'
);
CREATE TYPE "WebhookEventStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'DUPLICATE', 'INVALID', 'FAILED');

ALTER TABLE "Payment"
  ADD COLUMN "providerOrderId" TEXT,
  ADD COLUMN "providerPaymentId" TEXT,
  ADD COLUMN "providerSignature" TEXT,
  ADD COLUMN "refundedCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "authorizedAt" TIMESTAMP(3),
  ADD COLUMN "capturedAt" TIMESTAMP(3),
  ADD COLUMN "failedAt" TIMESTAMP(3),
  ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ADD COLUMN "metadata" JSONB;

ALTER TABLE "Payment" ALTER COLUMN "status" SET DEFAULT 'CREATED';

ALTER TABLE "Transaction"
  ADD COLUMN "idempotencyKey" TEXT;

ALTER TABLE "Refund"
  ADD COLUMN "providerRef" TEXT,
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "rawResponse" JSONB,
  ADD COLUMN "processedAt" TIMESTAMP(3),
  ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "Refund" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;

ALTER TABLE "Refund" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "Refund"
  ALTER COLUMN "status" TYPE "RefundStatus"
  USING CASE
    WHEN "status" IN ('PROCESSED', 'SUCCESS', 'SUCCEEDED', 'COMPLETED') THEN 'PROCESSED'::"RefundStatus"
    WHEN "status" IN ('FAILED', 'REJECTED') THEN 'FAILED'::"RefundStatus"
    WHEN "status" IN ('CANCELLED', 'CANCELED') THEN 'CANCELLED'::"RefundStatus"
    WHEN "status" IN ('PROCESSING') THEN 'PROCESSING'::"RefundStatus"
    ELSE 'REQUESTED'::"RefundStatus"
  END;
ALTER TABLE "Refund" ALTER COLUMN "status" SET DEFAULT 'REQUESTED';

CREATE TABLE "PaymentAuditEvent" (
  "id" TEXT NOT NULL,
  "paymentId" TEXT,
  "type" "PaymentEventType" NOT NULL,
  "message" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WebhookEvent" (
  "id" TEXT NOT NULL,
  "provider" "PaymentProvider" NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "status" "WebhookEventStatus" NOT NULL DEFAULT 'RECEIVED',
  "paymentId" TEXT,
  "payload" JSONB,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Transaction_idempotencyKey_key" ON "Transaction"("idempotencyKey");
CREATE INDEX "Transaction_paymentId_type_idx" ON "Transaction"("paymentId", "type");
CREATE UNIQUE INDEX "Refund_idempotencyKey_key" ON "Refund"("idempotencyKey");
CREATE INDEX "Refund_paymentId_status_idx" ON "Refund"("paymentId", "status");
CREATE INDEX "Refund_orderId_status_idx" ON "Refund"("orderId", "status");
CREATE INDEX "Payment_provider_providerOrderId_idx" ON "Payment"("provider", "providerOrderId");
CREATE INDEX "Payment_providerPaymentId_idx" ON "Payment"("providerPaymentId");
CREATE INDEX "Payment_status_expiresAt_idx" ON "Payment"("status", "expiresAt");
CREATE INDEX "PaymentAuditEvent_paymentId_createdAt_idx" ON "PaymentAuditEvent"("paymentId", "createdAt");
CREATE INDEX "PaymentAuditEvent_type_createdAt_idx" ON "PaymentAuditEvent"("type", "createdAt");
CREATE UNIQUE INDEX "WebhookEvent_provider_eventId_key" ON "WebhookEvent"("provider", "eventId");
CREATE UNIQUE INDEX "WebhookEvent_idempotencyKey_key" ON "WebhookEvent"("idempotencyKey");
CREATE INDEX "WebhookEvent_provider_eventType_idx" ON "WebhookEvent"("provider", "eventType");
CREATE INDEX "WebhookEvent_paymentId_idx" ON "WebhookEvent"("paymentId");

ALTER TABLE "PaymentAuditEvent"
  ADD CONSTRAINT "PaymentAuditEvent_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

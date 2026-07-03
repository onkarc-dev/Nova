-- Phase F5 order processing foundation.
-- Adds pending-payment order state, non-real payment providers for architecture
-- tests, and an optional cart link for duplicate order protection.

ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';

ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'SUCCESS';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

ALTER TYPE "PaymentProvider" ADD VALUE IF NOT EXISTS 'NULL';
ALTER TYPE "PaymentProvider" ADD VALUE IF NOT EXISTS 'MANUAL_PENDING';

ALTER TABLE "Order" ADD COLUMN "cartId" TEXT;

CREATE UNIQUE INDEX "Order_cartId_key" ON "Order"("cartId");

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_cartId_fkey"
  FOREIGN KEY ("cartId") REFERENCES "Cart"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Seller operations finance foundation.

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SELLER_SETTLEMENT_GENERATED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SELLER_SETTLEMENT_PAID';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SELLER_SETTLEMENT_FAILED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SELLER_COMMISSION_REVERSED';

CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'LOCKED', 'SETTLED', 'REVERSED');

CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED');

CREATE TABLE "CommissionRecord" (
  "id" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "orderItemId" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "settlementId" TEXT,
  "grossAmountCents" INTEGER NOT NULL,
  "commissionRateBps" INTEGER NOT NULL,
  "commissionAmountCents" INTEGER NOT NULL,
  "netAmountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommissionRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SellerSettlement" (
  "id" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "settlementNumber" TEXT NOT NULL,
  "grossAmountCents" INTEGER NOT NULL,
  "commissionAmountCents" INTEGER NOT NULL,
  "refundAdjustmentCents" INTEGER NOT NULL DEFAULT 0,
  "netPayoutCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "paidAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SellerSettlement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommissionRecord_orderItemId_paymentId_key" ON "CommissionRecord"("orderItemId", "paymentId");
CREATE INDEX "CommissionRecord_sellerId_status_createdAt_idx" ON "CommissionRecord"("sellerId", "status", "createdAt");
CREATE INDEX "CommissionRecord_storeId_status_createdAt_idx" ON "CommissionRecord"("storeId", "status", "createdAt");
CREATE INDEX "CommissionRecord_orderId_idx" ON "CommissionRecord"("orderId");
CREATE INDEX "CommissionRecord_settlementId_idx" ON "CommissionRecord"("settlementId");
CREATE UNIQUE INDEX "SellerSettlement_settlementNumber_key" ON "SellerSettlement"("settlementNumber");
CREATE UNIQUE INDEX "SellerSettlement_sellerId_storeId_periodStart_periodEnd_key" ON "SellerSettlement"("sellerId", "storeId", "periodStart", "periodEnd");
CREATE INDEX "SellerSettlement_sellerId_status_periodStart_idx" ON "SellerSettlement"("sellerId", "status", "periodStart");
CREATE INDEX "SellerSettlement_storeId_status_periodStart_idx" ON "SellerSettlement"("storeId", "status", "periodStart");

ALTER TABLE "CommissionRecord" ADD CONSTRAINT "CommissionRecord_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommissionRecord" ADD CONSTRAINT "CommissionRecord_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommissionRecord" ADD CONSTRAINT "CommissionRecord_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommissionRecord" ADD CONSTRAINT "CommissionRecord_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommissionRecord" ADD CONSTRAINT "CommissionRecord_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommissionRecord" ADD CONSTRAINT "CommissionRecord_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "SellerSettlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SellerSettlement" ADD CONSTRAINT "SellerSettlement_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SellerSettlement" ADD CONSTRAINT "SellerSettlement_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

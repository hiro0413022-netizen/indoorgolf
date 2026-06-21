-- AlterTable: Member にサブスク管理カラムを追加
ALTER TABLE "Member" ADD COLUMN "stripeSubscriptionId" TEXT;
ALTER TABLE "Member" ADD COLUMN "subscriptionStatus" TEXT NOT NULL DEFAULT 'NONE';
ALTER TABLE "Member" ADD COLUMN "currentPeriodEnd" DATETIME;

-- AlterTable: Payment に請求書冪等キーを追加
ALTER TABLE "Payment" ADD COLUMN "stripeInvoiceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Member_stripeSubscriptionId_key" ON "Member"("stripeSubscriptionId");
CREATE UNIQUE INDEX "Payment_stripeInvoiceId_key" ON "Payment"("stripeInvoiceId");

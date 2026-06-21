-- ============================================================
-- Turso 初期セットアップ用 SQL
-- 使い方: Turso ダッシュボード → 対象DB → 「SQL」タブ（または
--   turso db shell <DB名>）に、このファイルの中身を全部貼り付けて実行。
-- 一度だけ実行すればOK。打席3台の初期データも含みます。
-- ============================================================

-- 会員
CREATE TABLE IF NOT EXISTS "Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'REGULAR',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "stripeCustomerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "trialId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'NONE',
    "currentPeriodEnd" DATETIME
);

-- 打席
CREATE TABLE IF NOT EXISTS "Bay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- 予約
CREATE TABLE IF NOT EXISTS "Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "bayId" TEXT NOT NULL,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "guestCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "bayFeeCharged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reservation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_bayId_fkey" FOREIGN KEY ("bayId") REFERENCES "Bay" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 支払い
CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "stripePaymentIntentId" TEXT,
    "stripeInvoiceId" TEXT,
    "paidAt" DATETIME,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 体験申込
CREATE TABLE IF NOT EXISTS "Trial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "preferredDate" DATETIME,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- 体験アンケート
CREATE TABLE IF NOT EXISTS "TrialSurvey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trialId" TEXT NOT NULL,
    "satisfaction" INTEGER NOT NULL,
    "simulatorScore" INTEGER NOT NULL,
    "staffScore" INTEGER NOT NULL,
    "joinIntent" INTEGER NOT NULL,
    "interestedPlan" TEXT,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrialSurvey_trialId_fkey" FOREIGN KEY ("trialId") REFERENCES "Trial" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- インデックス（ユニーク制約）
CREATE UNIQUE INDEX IF NOT EXISTS "Member_email_key" ON "Member"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Member_stripeCustomerId_key" ON "Member"("stripeCustomerId");
CREATE UNIQUE INDEX IF NOT EXISTS "Member_trialId_key" ON "Member"("trialId");
CREATE UNIQUE INDEX IF NOT EXISTS "Member_stripeSubscriptionId_key" ON "Member"("stripeSubscriptionId");
CREATE UNIQUE INDEX IF NOT EXISTS "Bay_number_key" ON "Bay"("number");
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_stripeInvoiceId_key" ON "Payment"("stripeInvoiceId");
CREATE UNIQUE INDEX IF NOT EXISTS "TrialSurvey_trialId_key" ON "TrialSurvey"("trialId");

-- 初期データ: 打席3台
INSERT OR IGNORE INTO "Bay" ("id", "number", "name", "isActive") VALUES
  ('bay1', 1, '打席1番', true),
  ('bay2', 2, '打席2番', true),
  ('bay3', 3, '打席3番', true);

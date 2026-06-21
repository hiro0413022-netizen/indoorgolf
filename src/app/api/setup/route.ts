import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@libsql/client";

/**
 * Turso 初期セットアップ用エンドポイント（デプロイ後に一度だけ叩く）。
 *   GET /api/setup?secret=<SETUP_SECRET>
 * テーブル一式と打席3台を作成する。何度実行しても安全（IF NOT EXISTS）。
 */

const STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS "Member" (
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
  )`,
  `CREATE TABLE IF NOT EXISTS "Bay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
  )`,
  `CREATE TABLE IF NOT EXISTS "Reservation" (
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
  )`,
  `CREATE TABLE IF NOT EXISTS "Payment" (
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
  )`,
  `CREATE TABLE IF NOT EXISTS "Trial" (
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
  )`,
  `CREATE TABLE IF NOT EXISTS "TrialSurvey" (
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
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Member_email_key" ON "Member"("email")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Member_stripeCustomerId_key" ON "Member"("stripeCustomerId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Member_trialId_key" ON "Member"("trialId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Member_stripeSubscriptionId_key" ON "Member"("stripeSubscriptionId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Bay_number_key" ON "Bay"("number")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Payment_stripeInvoiceId_key" ON "Payment"("stripeInvoiceId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "TrialSurvey_trialId_key" ON "TrialSurvey"("trialId")`,
  `INSERT OR IGNORE INTO "Bay" ("id", "number", "name", "isActive") VALUES
    ('bay1', 1, '打席1番', true),
    ('bay2', 2, '打席2番', true),
    ('bay3', 3, '打席3番', true)`,
];

export async function GET(req: NextRequest) {
  const secret = process.env.SETUP_SECRET;
  const given = req.nextUrl.searchParams.get("secret");
  if (!secret || given !== secret) {
    return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
  }

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) {
    return NextResponse.json(
      { error: "TURSO_DATABASE_URL が未設定です" },
      { status: 500 }
    );
  }

  const client = createClient({ url, authToken });
  try {
    for (const stmt of STATEMENTS) {
      await client.execute(stmt);
    }
    const bays = await client.execute('SELECT * FROM "Bay"');
    return NextResponse.json({
      ok: true,
      message: "テーブル作成が完了しました",
      bayCount: bays.rows.length,
    });
  } catch (e) {
    return NextResponse.json(
      { error: String(e instanceof Error ? e.message : e) },
      { status: 500 }
    );
  }
}

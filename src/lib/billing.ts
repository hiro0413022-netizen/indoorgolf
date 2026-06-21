import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { requireStripe } from "@/lib/stripe";
import { PaymentStatus, PaymentType, SubscriptionStatus } from "@prisma/client";

const BAY_FEE = 330; // 円/回
const GUEST_FEE = 550; // 円/人（事業計画書に記載がなければ後で変更）

export interface BillingResult {
  memberId: string;
  memberName: string;
  bayFeeCount: number;
  guestFeeCount: number;
  totalAmount: number;
  stripeInvoiceItemId: string | null;
  skipped: boolean;
  skipReason?: string;
}

/**
 * 指定年月の打席料・同伴者料金を全会員分まとめて Stripe に請求アイテムとして登録する。
 * サブスク更新日（月次 Invoice）に自動で乗る仕組み。
 * year/month が未指定の場合は前月を対象にする。
 */
export async function runMonthlyBayFeeBilling(
  year?: number,
  month?: number
): Promise<BillingResult[]> {
  const stripe = requireStripe();

  const now = new Date();
  const targetYear = year ?? (month === 1 ? now.getFullYear() - 1 : now.getFullYear());
  const targetMonth = month ?? (now.getMonth() === 0 ? 12 : now.getMonth()); // 0-indexed → 前月

  const periodStart = new Date(targetYear, targetMonth - 1, 1);
  const periodEnd = new Date(targetYear, targetMonth, 1); // exclusive

  const label = `${targetYear}年${targetMonth}月`;

  // 未請求の完了済み予約を会員ごとに集計
  const uncharged = await prisma.reservation.findMany({
    where: {
      bayFeeCharged: false,
      status: "COMPLETED",
      startAt: { gte: periodStart, lt: periodEnd },
    },
    include: {
      member: {
        select: {
          id: true,
          name: true,
          stripeCustomerId: true,
          subscriptionStatus: true,
        },
      },
    },
  });

  // 会員ごとにグループ化
  const byMember = new Map<
    string,
    {
      member: (typeof uncharged)[0]["member"];
      reservations: typeof uncharged;
    }
  >();
  for (const r of uncharged) {
    const entry = byMember.get(r.memberId) ?? {
      member: r.member,
      reservations: [],
    };
    entry.reservations.push(r);
    byMember.set(r.memberId, entry);
  }

  const results: BillingResult[] = [];

  for (const { member, reservations } of byMember.values()) {
    const bayCount = reservations.length;
    const guestCount = reservations.reduce((s, r) => s + r.guestCount, 0);
    const totalAmount = bayCount * BAY_FEE + guestCount * GUEST_FEE;

    // Stripe 未契約の場合はスキップ（手動請求が必要）
    if (
      !member.stripeCustomerId ||
      member.subscriptionStatus === SubscriptionStatus.NONE ||
      member.subscriptionStatus === SubscriptionStatus.CANCELED
    ) {
      results.push({
        memberId: member.id,
        memberName: member.name,
        bayFeeCount: bayCount,
        guestFeeCount: guestCount,
        totalAmount,
        stripeInvoiceItemId: null,
        skipped: true,
        skipReason: "Stripe未契約のため手動請求が必要",
      });
      continue;
    }

    let invoiceItemId: string | null = null;
    try {
      // Stripe に Invoice Item を追加（次回のサブスク Invoice に自動で乗る）
      const item = await stripe.invoiceItems.create({
        customer: member.stripeCustomerId,
        amount: totalAmount,
        currency: "jpy",
        description: `${label} 打席料（${bayCount}回）${guestCount > 0 ? ` + 同伴者料金（${guestCount}名）` : ""}`,
        metadata: {
          memberId: member.id,
          month: label,
          bayCount: String(bayCount),
          guestCount: String(guestCount),
        },
      } as Stripe.InvoiceItemCreateParams);
      invoiceItemId = item.id;

      // DB に請求記録
      await prisma.$transaction([
        prisma.payment.create({
          data: {
            memberId: member.id,
            amount: totalAmount,
            type: PaymentType.BAY_FEE,
            status: PaymentStatus.PENDING, // Invoice 支払い完了時に webhook で PAID へ更新
            description: `${label} 打席料（${bayCount}回）${guestCount > 0 ? ` + 同伴者料金（${guestCount}名）` : ""}`,
          },
        }),
        // 請求済みフラグを立てる
        ...reservations.map((r) =>
          prisma.reservation.update({
            where: { id: r.id },
            data: { bayFeeCharged: true },
          })
        ),
      ]);
    } catch (err) {
      console.error(`${member.name} の Stripe 請求アイテム登録失敗:`, err);
      results.push({
        memberId: member.id,
        memberName: member.name,
        bayFeeCount: bayCount,
        guestFeeCount: guestCount,
        totalAmount,
        stripeInvoiceItemId: null,
        skipped: true,
        skipReason: (err as Error).message,
      });
      continue;
    }

    results.push({
      memberId: member.id,
      memberName: member.name,
      bayFeeCount: bayCount,
      guestFeeCount: guestCount,
      totalAmount,
      stripeInvoiceItemId: invoiceItemId,
      skipped: false,
    });
  }

  return results;
}

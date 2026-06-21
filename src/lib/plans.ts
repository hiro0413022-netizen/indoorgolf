import { MemberPlan } from "@prisma/client";

export const PLAN_CONFIG = {
  [MemberPlan.REGULAR]: {
    label: "レギュラー",
    monthlyFee: 16500,
    maxMinutesPerDay: 60,
    maxReservationsHeld: 3,
    guestAllowedPerMonth: 0,
  },
  [MemberPlan.MASTER]: {
    label: "マスター",
    monthlyFee: 22000,
    maxMinutesPerDay: null, // 無制限
    maxReservationsHeld: null,
    guestAllowedPerMonth: 2,
  },
  [MemberPlan.LESSON]: {
    label: "レッスン",
    monthlyFee: 11000,
    maxMinutesPerDay: 60,
    maxReservationsHeld: 1,
    guestAllowedPerMonth: 0,
  },
  [MemberPlan.CORPORATE]: {
    label: "法人",
    monthlyFee: 33000,
    maxMinutesPerDay: null,
    maxReservationsHeld: null,
    guestAllowedPerMonth: 4,
  },
} as const;

export const SESSION_DURATION_MINUTES: Record<MemberPlan, number> = {
  [MemberPlan.REGULAR]: 60,
  [MemberPlan.MASTER]: 90,
  [MemberPlan.LESSON]: 60,
  [MemberPlan.CORPORATE]: 90,
};

/**
 * プランごとの Stripe Price ID（月額サブスクリプション）。
 * Stripe ダッシュボードで作成した price を環境変数で割り当てる。
 */
export const STRIPE_PRICE_BY_PLAN: Record<MemberPlan, string | undefined> = {
  [MemberPlan.REGULAR]: process.env.STRIPE_PRICE_REGULAR,
  [MemberPlan.MASTER]: process.env.STRIPE_PRICE_MASTER,
  [MemberPlan.LESSON]: process.env.STRIPE_PRICE_LESSON,
  [MemberPlan.CORPORATE]: process.env.STRIPE_PRICE_CORPORATE,
};

/** Stripe Price ID から MemberPlan を逆引きする */
export function planFromPriceId(priceId: string): MemberPlan | null {
  const entry = (Object.entries(STRIPE_PRICE_BY_PLAN) as [
    MemberPlan,
    string | undefined,
  ][]).find(([, id]) => id === priceId);
  return entry ? entry[0] : null;
}

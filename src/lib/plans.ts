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

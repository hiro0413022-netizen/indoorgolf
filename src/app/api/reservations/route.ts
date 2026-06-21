import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MemberPlan, ReservationStatus } from "@prisma/client";
import { PLAN_CONFIG, SESSION_DURATION_MINUTES } from "@/lib/plans";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bayId = searchParams.get("bayId");
  const date = searchParams.get("date"); // YYYY-MM-DD
  const memberId = searchParams.get("memberId");

  let startOfDay: Date | undefined;
  let endOfDay: Date | undefined;
  if (date) {
    startOfDay = new Date(`${date}T00:00:00+09:00`);
    endOfDay = new Date(`${date}T23:59:59+09:00`);
  }

  const reservations = await prisma.reservation.findMany({
    where: {
      ...(bayId ? { bayId } : {}),
      ...(memberId ? { memberId } : {}),
      ...(startOfDay && endOfDay
        ? { startAt: { gte: startOfDay, lte: endOfDay } }
        : {}),
      status: { not: ReservationStatus.CANCELLED },
    },
    include: {
      member: { select: { id: true, name: true, plan: true } },
      bay: { select: { id: true, number: true, name: true } },
    },
    orderBy: { startAt: "asc" },
  });

  return NextResponse.json(reservations);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { memberId, bayId, startAt, guestCount = 0 } = body;

  if (!memberId || !bayId || !startAt) {
    return NextResponse.json(
      { error: "memberId, bayId, startAt は必須です" },
      { status: 400 }
    );
  }

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member || member.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "有効な会員が見つかりません" },
      { status: 404 }
    );
  }

  const plan = member.plan as MemberPlan;
  const planConfig = PLAN_CONFIG[plan];
  const durationMinutes = SESSION_DURATION_MINUTES[plan];

  const start = new Date(startAt);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  // 同伴者チェック（マスター以外はゲスト不可）
  if (guestCount > 0 && planConfig.guestAllowedPerMonth === 0) {
    return NextResponse.json(
      { error: "このプランでは同伴者を連れることができません" },
      { status: 400 }
    );
  }

  // 同日利用チェック（レギュラーは1日1回）
  if (planConfig.maxMinutesPerDay !== null) {
    const dayStart = new Date(start);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(start);
    dayEnd.setHours(23, 59, 59, 999);

    const todayReservations = await prisma.reservation.count({
      where: {
        memberId,
        startAt: { gte: dayStart, lte: dayEnd },
        status: { not: ReservationStatus.CANCELLED },
      },
    });

    if (todayReservations > 0) {
      return NextResponse.json(
        { error: "このプランでは1日1回のみ予約できます" },
        { status: 400 }
      );
    }
  }

  // 保持予約数チェック
  if (planConfig.maxReservationsHeld !== null) {
    const now = new Date();
    const heldReservations = await prisma.reservation.count({
      where: {
        memberId,
        startAt: { gte: now },
        status: ReservationStatus.CONFIRMED,
      },
    });

    if (heldReservations >= planConfig.maxReservationsHeld) {
      return NextResponse.json(
        {
          error: `予約の保持上限（${planConfig.maxReservationsHeld}件）に達しています`,
        },
        { status: 400 }
      );
    }
  }

  // 打席の空き確認
  const conflict = await prisma.reservation.findFirst({
    where: {
      bayId,
      status: { not: ReservationStatus.CANCELLED },
      OR: [
        { startAt: { lt: end }, endAt: { gt: start } },
      ],
    },
  });

  if (conflict) {
    return NextResponse.json(
      { error: "選択した時間帯はすでに予約が入っています" },
      { status: 409 }
    );
  }

  const reservation = await prisma.reservation.create({
    data: {
      memberId,
      bayId,
      startAt: start,
      endAt: end,
      guestCount,
    },
    include: {
      member: { select: { name: true, plan: true } },
      bay: { select: { number: true, name: true } },
    },
  });

  return NextResponse.json(reservation, { status: 201 });
}

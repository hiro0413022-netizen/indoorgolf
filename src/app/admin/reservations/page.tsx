import { prisma } from "@/lib/prisma";
import { PLAN_CONFIG } from "@/lib/plans";
import { MemberPlan } from "@prisma/client";
import Link from "next/link";
import ReservationCard from "./ReservationCard";

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const targetDate = date ?? new Date().toISOString().split("T")[0];

  const dayStart = new Date(`${targetDate}T00:00:00`);
  const dayEnd = new Date(`${targetDate}T23:59:59`);

  const [reservations, bays] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        startAt: { gte: dayStart, lte: dayEnd },
        status: { not: "CANCELLED" },
      },
      include: {
        member: { select: { name: true, plan: true } },
        bay: { select: { number: true, name: true } },
      },
      orderBy: [{ bay: { number: "asc" } }, { startAt: "asc" }],
    }),
    prisma.bay.findMany({ orderBy: { number: "asc" } }),
  ]);

  const prevDate = new Date(targetDate);
  prevDate.setDate(prevDate.getDate() - 1);
  const nextDate = new Date(targetDate);
  nextDate.setDate(nextDate.getDate() + 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">
            ← トップ
          </Link>
          <h1 className="text-xl font-bold text-gray-900">予約管理</h1>
        </div>
        <Link
          href="/admin/reservations/new"
          className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-800 transition"
        >
          + 予約追加
        </Link>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        {/* 日付ナビゲーション */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-xl border p-4">
          <Link
            href={`/admin/reservations?date=${prevDate.toISOString().split("T")[0]}`}
            className="text-gray-500 hover:text-gray-900 px-3 py-1"
          >
            ← 前日
          </Link>
          <h2 className="text-lg font-semibold">
            {new Date(targetDate).toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "short",
            })}
          </h2>
          <Link
            href={`/admin/reservations?date=${nextDate.toISOString().split("T")[0]}`}
            className="text-gray-500 hover:text-gray-900 px-3 py-1"
          >
            翌日 →
          </Link>
        </div>

        {/* 打席別一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bays.map((bay) => {
            const bayReservations = reservations.filter(
              (r) => r.bay.number === bay.number
            );
            return (
              <div
                key={bay.id}
                className="bg-white rounded-xl border shadow-sm overflow-hidden"
              >
                <div className="bg-green-700 text-white px-4 py-3">
                  <h3 className="font-semibold">{bay.name}</h3>
                  <p className="text-xs text-green-200">{bayReservations.length}件</p>
                </div>
                <div className="divide-y">
                  {bayReservations.length === 0 ? (
                    <p className="text-center py-8 text-gray-400 text-sm">
                      予約なし
                    </p>
                  ) : (
                    bayReservations.map((r) => (
                      <ReservationCard
                        key={r.id}
                        id={r.id}
                        memberName={r.member.name}
                        planLabel={
                          PLAN_CONFIG[r.member.plan as MemberPlan].label
                        }
                        startTime={formatTime(r.startAt)}
                        endTime={formatTime(r.endAt)}
                        guestCount={r.guestCount}
                        status={r.status}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

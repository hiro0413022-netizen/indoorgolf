import { prisma } from "@/lib/prisma";
import Link from "next/link";
import BillingBatchPanel from "./BillingBatchPanel";

// ビルド時にDB接続しないよう動的レンダリング
export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const now = new Date();

  // 未請求の完了済み予約を会員別に集計（今月分）
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [uncharged, lastMonthCharged] = await Promise.all([
    prisma.reservation.groupBy({
      by: ["memberId"],
      where: { bayFeeCharged: false, status: "COMPLETED" },
      _count: { id: true },
      _sum: { guestCount: true },
    }),
    prisma.payment.findMany({
      where: {
        type: "BAY_FEE",
        createdAt: { gte: prevMonthStart, lt: thisMonthStart },
      },
      include: { member: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // 会員名を取得
  const memberIds = uncharged.map((u) => u.memberId);
  const members = await prisma.member.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, name: true, plan: true, subscriptionStatus: true },
  });
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m]));

  const BAY_FEE = 330;
  const GUEST_FEE = 550;
  const totalUnchargedAmount = uncharged.reduce(
    (s, u) =>
      s + u._count.id * BAY_FEE + (u._sum.guestCount ?? 0) * GUEST_FEE,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">
          ← トップ
        </Link>
        <h1 className="text-xl font-bold text-gray-900">月末まとめ請求</h1>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* 未請求サマリー */}
        <section className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">未請求の打席料</h2>
          <div className="flex gap-6 mb-4">
            <div>
              <p className="text-xs text-gray-500">対象会員数</p>
              <p className="text-3xl font-bold text-amber-600">
                {uncharged.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">請求予定合計</p>
              <p className="text-3xl font-bold text-gray-900">
                ¥{totalUnchargedAmount.toLocaleString()}
              </p>
            </div>
          </div>

          {uncharged.length > 0 && (
            <table className="w-full text-sm mb-4">
              <thead className="bg-gray-50 border-y">
                <tr>
                  <th className="text-left px-4 py-2 text-gray-600 font-medium">会員名</th>
                  <th className="text-left px-4 py-2 text-gray-600 font-medium">プラン</th>
                  <th className="text-right px-4 py-2 text-gray-600 font-medium">利用回数</th>
                  <th className="text-right px-4 py-2 text-gray-600 font-medium">同伴者</th>
                  <th className="text-right px-4 py-2 text-gray-600 font-medium">請求額</th>
                  <th className="text-left px-4 py-2 text-gray-600 font-medium">課金状態</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {uncharged.map((u) => {
                  const m = memberMap[u.memberId];
                  const guests = u._sum.guestCount ?? 0;
                  const amount = u._count.id * BAY_FEE + guests * GUEST_FEE;
                  return (
                    <tr key={u.memberId}>
                      <td className="px-4 py-2">{m?.name ?? u.memberId}</td>
                      <td className="px-4 py-2 text-gray-500">{m?.plan}</td>
                      <td className="px-4 py-2 text-right">{u._count.id}回</td>
                      <td className="px-4 py-2 text-right">{guests}名</td>
                      <td className="px-4 py-2 text-right font-medium">
                        ¥{amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={
                            m?.subscriptionStatus === "ACTIVE"
                              ? "text-green-700 text-xs"
                              : "text-red-600 text-xs"
                          }
                        >
                          {m?.subscriptionStatus === "ACTIVE"
                            ? "Stripe課金中"
                            : "要手動請求"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          <BillingBatchPanel hasUncharged={uncharged.length > 0} />
        </section>

        {/* 前月の請求履歴 */}
        <section className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <h2 className="font-semibold text-gray-900 p-6 pb-3">
            先月の請求実績
          </h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-y">
              <tr>
                <th className="text-left px-6 py-2 text-gray-600 font-medium">会員名</th>
                <th className="text-left px-6 py-2 text-gray-600 font-medium">内容</th>
                <th className="text-right px-6 py-2 text-gray-600 font-medium">金額</th>
                <th className="text-left px-6 py-2 text-gray-600 font-medium">状態</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lastMonthCharged.map((p) => (
                <tr key={p.id}>
                  <td className="px-6 py-2">{p.member.name}</td>
                  <td className="px-6 py-2 text-gray-500">{p.description}</td>
                  <td className="px-6 py-2 text-right">
                    ¥{p.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-2">
                    <span
                      className={
                        p.status === "PAID"
                          ? "text-green-700 text-xs"
                          : p.status === "FAILED"
                            ? "text-red-600 text-xs"
                            : "text-gray-500 text-xs"
                      }
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {lastMonthCharged.length === 0 && (
            <p className="text-center py-8 text-gray-400 text-sm">
              先月の請求記録はありません
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

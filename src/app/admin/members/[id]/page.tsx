import { prisma } from "@/lib/prisma";
import { PLAN_CONFIG } from "@/lib/plans";
import { MemberPlan, PaymentStatus, SubscriptionStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import SubscriptionPanel from "./SubscriptionPanel";

const SUB_LABEL: Record<SubscriptionStatus, string> = {
  NONE: "未契約",
  ACTIVE: "課金中",
  PAST_DUE: "支払い遅延",
  CANCELED: "解約済み",
};

const SUB_COLOR: Record<SubscriptionStatus, string> = {
  NONE: "bg-gray-100 text-gray-600",
  ACTIVE: "bg-green-100 text-green-800",
  PAST_DUE: "bg-red-100 text-red-800",
  CANCELED: "bg-gray-100 text-gray-500",
};

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      payments: { orderBy: { createdAt: "desc" }, take: 12 },
    },
  });
  if (!member) notFound();

  const planCfg = PLAN_CONFIG[member.plan as MemberPlan];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link
          href="/admin/members"
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ← 会員一覧
        </Link>
        <h1 className="text-xl font-bold text-gray-900">{member.name}</h1>
      </header>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* 基本情報 */}
        <section className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">基本情報</h2>
          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-gray-500">メール</dt>
            <dd>{member.email}</dd>
            <dt className="text-gray-500">電話番号</dt>
            <dd>{member.phone ?? "—"}</dd>
            <dt className="text-gray-500">プラン</dt>
            <dd>
              {planCfg.label}（月額 {planCfg.monthlyFee.toLocaleString()} 円）
            </dd>
            <dt className="text-gray-500">有効期限</dt>
            <dd>
              {member.expiresAt
                ? new Date(member.expiresAt).toLocaleDateString("ja-JP")
                : "—"}
            </dd>
          </dl>
        </section>

        {/* 月会費サブスクリプション */}
        <section className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">月会費の定期課金</h2>
            <span
              className={`text-xs px-2 py-1 rounded-full ${SUB_COLOR[member.subscriptionStatus]}`}
            >
              {SUB_LABEL[member.subscriptionStatus]}
            </span>
          </div>

          {member.currentPeriodEnd && (
            <p className="text-sm text-gray-500 mb-4">
              次回更新日：
              {new Date(member.currentPeriodEnd).toLocaleDateString("ja-JP")}
            </p>
          )}

          <SubscriptionPanel
            memberId={member.id}
            status={member.subscriptionStatus}
          />
        </section>

        {/* 決済履歴 */}
        <section className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <h2 className="font-semibold text-gray-900 p-6 pb-3">決済履歴</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-y">
              <tr>
                <th className="text-left px-6 py-2 text-gray-600 font-medium">日付</th>
                <th className="text-left px-6 py-2 text-gray-600 font-medium">内容</th>
                <th className="text-right px-6 py-2 text-gray-600 font-medium">金額</th>
                <th className="text-left px-6 py-2 text-gray-600 font-medium">状態</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {member.payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-6 py-2 text-gray-500">
                    {new Date(p.createdAt).toLocaleDateString("ja-JP")}
                  </td>
                  <td className="px-6 py-2">{p.description ?? p.type}</td>
                  <td className="px-6 py-2 text-right">
                    {p.amount.toLocaleString()} 円
                  </td>
                  <td className="px-6 py-2">
                    <span
                      className={
                        p.status === PaymentStatus.PAID
                          ? "text-green-700"
                          : p.status === PaymentStatus.FAILED
                            ? "text-red-600"
                            : "text-gray-500"
                      }
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {member.payments.length === 0 && (
            <p className="text-center py-8 text-gray-400 text-sm">
              決済履歴がありません
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

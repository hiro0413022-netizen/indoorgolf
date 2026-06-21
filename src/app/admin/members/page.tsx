import { prisma } from "@/lib/prisma";
import { PLAN_CONFIG } from "@/lib/plans";
import { MemberPlan, MemberStatus } from "@prisma/client";
import Link from "next/link";

// ビルド時にDB接続しないよう動的レンダリング
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<MemberStatus, string> = {
  ACTIVE: "有効",
  SUSPENDED: "停止",
  EXPIRED: "期限切",
  CANCELLED: "退会",
};

const STATUS_COLOR: Record<MemberStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  SUSPENDED: "bg-yellow-100 text-yellow-800",
  EXPIRED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export default async function MembersPage() {
  const members = await prisma.member.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      plan: true,
      status: true,
      joinedAt: true,
      expiresAt: true,
    },
  });

  const counts = {
    total: members.length,
    active: members.filter((m) => m.status === "ACTIVE").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">
            ← トップ
          </Link>
          <h1 className="text-xl font-bold text-gray-900">会員管理</h1>
        </div>
        <Link
          href="/admin/members/new"
          className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-800 transition"
        >
          + 新規登録
        </Link>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <p className="text-xs text-gray-500">総会員数</p>
            <p className="text-3xl font-bold text-gray-900">{counts.total}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <p className="text-xs text-gray-500">有効会員</p>
            <p className="text-3xl font-bold text-green-700">{counts.active}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <p className="text-xs text-gray-500">損益分岐（目安）</p>
            <p className="text-lg font-semibold text-gray-700">80〜90名</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <p className="text-xs text-gray-500">達成率</p>
            <p className="text-2xl font-bold text-blue-700">
              {Math.round((counts.active / 85) * 100)}%
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">氏名</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium hidden sm:table-cell">メール</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">プラン</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">ステータス</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">有効期限</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{m.email}</td>
                  <td className="px-4 py-3">
                    <span className="bg-green-50 text-green-800 text-xs px-2 py-1 rounded-full">
                      {PLAN_CONFIG[m.plan as MemberPlan].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${STATUS_COLOR[m.status as MemberStatus]}`}
                    >
                      {STATUS_LABEL[m.status as MemberStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {m.expiresAt
                      ? new Date(m.expiresAt).toLocaleDateString("ja-JP")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/members/${m.id}`}
                      className="text-green-700 hover:underline text-xs"
                    >
                      詳細
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {members.length === 0 && (
            <p className="text-center py-12 text-gray-400">
              会員が登録されていません
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

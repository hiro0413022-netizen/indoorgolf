import { prisma } from "@/lib/prisma";
import { TrialStatus } from "@prisma/client";
import Link from "next/link";

const STATUS_LABEL: Record<TrialStatus, string> = {
  APPLIED: "申込受付",
  SCHEDULED: "体験予定",
  COMPLETED: "体験済み",
  CONVERTED: "入会済み",
  CANCELLED: "見送り",
};

const STATUS_COLOR: Record<TrialStatus, string> = {
  APPLIED: "bg-blue-100 text-blue-800",
  SCHEDULED: "bg-indigo-100 text-indigo-800",
  COMPLETED: "bg-amber-100 text-amber-800",
  CONVERTED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export default async function TrialsPage() {
  const trials = await prisma.trial.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      survey: { select: { satisfaction: true, joinIntent: true } },
      member: { select: { id: true } },
    },
  });

  // ファネル集計
  const funnel = {
    applied: trials.length,
    completed: trials.filter((t) =>
      ["COMPLETED", "CONVERTED"].includes(t.status)
    ).length,
    converted: trials.filter((t) => t.status === "CONVERTED").length,
  };
  const conversionRate =
    funnel.applied > 0
      ? Math.round((funnel.converted / funnel.applied) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">
          ← トップ
        </Link>
        <h1 className="text-xl font-bold text-gray-900">体験申し込み管理</h1>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        {/* ファネル */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <p className="text-xs text-gray-500">体験申込</p>
            <p className="text-3xl font-bold text-blue-700">{funnel.applied}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <p className="text-xs text-gray-500">体験実施</p>
            <p className="text-3xl font-bold text-amber-600">
              {funnel.completed}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <p className="text-xs text-gray-500">入会</p>
            <p className="text-3xl font-bold text-green-700">
              {funnel.converted}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <p className="text-xs text-gray-500">入会率</p>
            <p className="text-3xl font-bold text-gray-900">{conversionRate}%</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">氏名</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium hidden sm:table-cell">連絡先</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">希望日時</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">満足度</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">ステータス</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {trials.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    <div>{t.email}</div>
                    <div className="text-xs">{t.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {t.preferredDate
                      ? new Date(t.preferredDate).toLocaleString("ja-JP", {
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {t.survey ? (
                      <span className="text-amber-500">
                        {"★".repeat(t.survey.satisfaction)}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${STATUS_COLOR[t.status]}`}
                    >
                      {STATUS_LABEL[t.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {trials.length === 0 && (
            <p className="text-center py-12 text-gray-400">
              体験申し込みがまだありません
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

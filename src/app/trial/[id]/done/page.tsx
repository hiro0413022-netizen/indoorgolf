import { prisma } from "@/lib/prisma";
import { PLAN_CONFIG } from "@/lib/plans";
import { MemberPlan } from "@prisma/client";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function DonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trial = await prisma.trial.findUnique({
    where: { id },
    include: { member: true },
  });
  if (!trial || !trial.member) notFound();

  const member = trial.member;

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-green-700">⛳</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ご入会ありがとうございます！
          </h1>
          <p className="text-gray-600 text-sm">
            {member.name} 様の会員登録が完了しました。
          </p>

          <div className="mt-6 bg-gray-50 rounded-lg px-4 py-4 text-sm text-left space-y-1">
            <p>
              <span className="text-gray-500">プラン：</span>
              <span className="font-medium">
                {PLAN_CONFIG[member.plan as MemberPlan].label}（月額
                {PLAN_CONFIG[member.plan as MemberPlan].monthlyFee.toLocaleString()}
                円）
              </span>
            </p>
            <p>
              <span className="text-gray-500">有効期限：</span>
              <span className="font-medium">
                {member.expiresAt
                  ? new Date(member.expiresAt).toLocaleDateString("ja-JP")
                  : "—"}
              </span>
            </p>
          </div>

          <p className="text-xs text-gray-400 mt-6">
            登録メールアドレスでログインし、打席のご予約が可能になります。
          </p>

          <Link
            href="/"
            className="inline-block mt-6 text-green-700 text-sm font-medium hover:underline"
          >
            トップへ戻る
          </Link>
        </div>
      </div>
    </main>
  );
}

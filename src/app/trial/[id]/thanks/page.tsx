import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function TrialThanksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trial = await prisma.trial.findUnique({ where: { id } });
  if (!trial) notFound();

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-green-700">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            お申し込みありがとうございます
          </h1>
          <p className="text-gray-600 text-sm mb-1">
            {trial.name} 様の体験申し込みを受け付けました。
          </p>
          <p className="text-gray-500 text-sm">
            担当者より体験日時のご連絡を差し上げます。
          </p>

          {trial.preferredDate && (
            <div className="mt-4 bg-gray-50 rounded-lg px-4 py-3 text-sm">
              <span className="text-gray-500">ご希望日時：</span>
              <span className="font-medium">
                {new Date(trial.preferredDate).toLocaleString("ja-JP", {
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}

          <div className="mt-8 border-t pt-6">
            <p className="text-xs text-gray-400 mb-3">
              体験後、こちらからアンケートにご協力ください
            </p>
            <Link
              href={`/trial/${trial.id}/survey`}
              className="inline-block text-green-700 text-sm font-medium hover:underline"
            >
              体験後アンケートへ進む →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

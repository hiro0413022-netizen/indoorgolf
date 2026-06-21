"use client";

import { useState } from "react";

type BillingResult = {
  memberName: string;
  bayFeeCount: number;
  guestFeeCount: number;
  totalAmount: number;
  skipped: boolean;
  skipReason?: string;
};

export default function BillingBatchPanel({
  hasUncharged,
}: {
  hasUncharged: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BillingResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runBatch() {
    if (
      !confirm(
        "対象会員の打席料を Stripe に請求アイテムとして登録します。よろしいですか？"
      )
    )
      return;

    setLoading(true);
    setError(null);
    setResults(null);

    const res = await fetch("/api/billing/monthly-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "バッチ実行に失敗しました");
      setLoading(false);
      return;
    }

    setResults(data.results);
    setLoading(false);
  }

  return (
    <div>
      <button
        onClick={runBatch}
        disabled={loading || !hasUncharged}
        className="bg-amber-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-amber-700 transition disabled:opacity-50"
      >
        {loading ? "処理中..." : "月末まとめ請求を実行"}
      </button>

      {!hasUncharged && (
        <p className="text-sm text-gray-400 mt-2">未請求の利用がありません</p>
      )}

      {error && (
        <p className="text-red-600 text-sm mt-3 bg-red-50 rounded px-3 py-2">
          {error}
        </p>
      )}

      {results && (
        <div className="mt-4 border rounded-lg overflow-hidden text-sm">
          <div className="bg-green-50 px-4 py-3 font-medium text-green-800">
            バッチ完了 — {results.filter((r) => !r.skipped).length}件 登録、
            {results.filter((r) => r.skipped).length}件 スキップ
          </div>
          <div className="divide-y">
            {results.map((r, i) => (
              <div
                key={i}
                className={`px-4 py-2 flex items-center justify-between ${r.skipped ? "bg-gray-50 text-gray-400" : ""}`}
              >
                <div>
                  <span className="font-medium">{r.memberName}</span>
                  <span className="ml-2 text-gray-500">
                    {r.bayFeeCount}回
                    {r.guestFeeCount > 0 ? ` + 同伴${r.guestFeeCount}名` : ""}
                  </span>
                  {r.skipped && r.skipReason && (
                    <span className="ml-2 text-xs text-red-500">
                      ({r.skipReason})
                    </span>
                  )}
                </div>
                <span className={r.skipped ? "text-gray-400" : "font-semibold"}>
                  ¥{r.totalAmount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

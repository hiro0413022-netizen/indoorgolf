"use client";

import { useState } from "react";
import { SubscriptionStatus } from "@prisma/client";

export default function SubscriptionPanel({
  memberId,
  status,
}: {
  memberId: string;
  status: SubscriptionStatus;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "決済の開始に失敗しました");
      setLoading(false);
      return;
    }
    window.location.href = data.url;
  }

  async function cancelSubscription() {
    if (!confirm("期間終了時に解約します。よろしいですか？")) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/members/${memberId}/subscription`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "解約に失敗しました");
      setLoading(false);
      return;
    }
    window.location.reload();
  }

  const isActive = status === SubscriptionStatus.ACTIVE;

  return (
    <div>
      {isActive ? (
        <button
          onClick={cancelSubscription}
          disabled={loading}
          className="text-sm text-red-600 border border-red-200 rounded-lg px-4 py-2 hover:bg-red-50 transition disabled:opacity-50"
        >
          {loading ? "処理中..." : "サブスクリプションを解約"}
        </button>
      ) : (
        <button
          onClick={startCheckout}
          disabled={loading}
          className="bg-green-700 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-green-800 transition disabled:opacity-50"
        >
          {loading ? "処理中..." : "月会費の自動引き落としを開始"}
        </button>
      )}

      {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

      <p className="text-xs text-gray-400 mt-3">
        Stripe Checkout でクレジットカードを登録し、毎月自動で会費を引き落とします。
      </p>
    </div>
  );
}

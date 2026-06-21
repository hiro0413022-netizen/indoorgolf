"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PLAN_OPTIONS = [
  { value: "REGULAR", label: "レギュラー（月16,500円）" },
  { value: "MASTER", label: "マスター（月22,000円）" },
  { value: "LESSON", label: "レッスン（月11,000円）" },
  { value: "CORPORATE", label: "法人（月33,000円）" },
];

const RATINGS = [
  { key: "satisfaction", label: "総合的な満足度" },
  { key: "simulatorScore", label: "シミュレーターの体験" },
  { key: "staffScore", label: "スタッフの対応" },
  { key: "joinIntent", label: "入会したいと思う度合い" },
] as const;

type RatingKey = (typeof RATINGS)[number]["key"];

export default function SurveyForm({
  trialId,
  name,
}: {
  trialId: string;
  name: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<RatingKey, number>>({
    satisfaction: 0,
    simulatorScore: 0,
    staffScore: 0,
    joinIntent: 0,
  });
  const [interestedPlan, setInterestedPlan] = useState("");
  const [comment, setComment] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (Object.values(scores).some((s) => s === 0)) {
      setError("すべての評価項目をご入力ください");
      return;
    }
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/trials/${trialId}/survey`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...scores,
        interestedPlan: interestedPlan || undefined,
        comment: comment || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "送信に失敗しました");
      setLoading(false);
      return;
    }

    router.push(`/trial/${trialId}/register`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-sm text-green-700 font-semibold mb-1">STEP 2 / 3</p>
          <h1 className="text-2xl font-bold text-gray-900">体験後アンケート</h1>
          <p className="text-gray-500 text-sm mt-2">
            {name} 様、体験はいかがでしたか？
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border p-6 space-y-6"
        >
          {RATINGS.map((r) => (
            <div key={r.key}>
              <p className="text-sm font-medium text-gray-700 mb-2">{r.label}</p>
              <StarRating
                value={scores[r.key]}
                onChange={(v) => setScores({ ...scores, [r.key]: v })}
              />
            </div>
          ))}

          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              ご関心のあるプラン
            </span>
            <select
              value={interestedPlan}
              onChange={(e) => setInterestedPlan(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-green-700 outline-none"
            >
              <option value="">選択しない</option>
              {PLAN_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              ご意見・ご感想（任意）
            </span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-green-700 outline-none resize-none"
              placeholder="ご自由にご記入ください"
            />
          </label>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition disabled:opacity-50"
          >
            {loading ? "送信中..." : "回答して入会手続きへ"}
          </button>
        </form>
      </div>
    </main>
  );
}

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="text-3xl leading-none transition-colors"
          style={{ color: n <= (hover || value) ? "#f59e0b" : "#d1d5db" }}
          aria-label={`${n}点`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

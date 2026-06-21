"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PLANS = [
  {
    value: "REGULAR",
    label: "レギュラー",
    price: "月16,500円",
    desc: "1日1回60分・予約保持3件",
  },
  {
    value: "MASTER",
    label: "マスター",
    price: "月22,000円",
    desc: "利用無制限・同伴者月2回",
  },
  {
    value: "LESSON",
    label: "レッスン",
    price: "月11,000円",
    desc: "週1回レッスン付き",
  },
  {
    value: "CORPORATE",
    label: "法人",
    price: "月33,000円",
    desc: "法人向け・同伴者月4回",
  },
];

export default function RegisterForm({
  trialId,
  name,
  email,
  phone,
  suggestedPlan,
}: {
  trialId: string;
  name: string;
  email: string;
  phone: string;
  suggestedPlan: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState(suggestedPlan ?? "REGULAR");
  const [phoneVal, setPhoneVal] = useState(phone);
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) {
      setError("利用規約への同意が必要です");
      return;
    }
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/trials/${trialId}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, password, phone: phoneVal }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "登録に失敗しました");
      setLoading(false);
      return;
    }

    router.push(`/trial/${trialId}/done`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-sm text-green-700 font-semibold mb-1">STEP 3 / 3</p>
          <h1 className="text-2xl font-bold text-gray-900">新規会員登録</h1>
          <p className="text-gray-500 text-sm mt-2">
            体験ありがとうございました。ご入会手続きを行います。
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border p-6 space-y-5"
        >
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm">
            <p>
              <span className="text-gray-500">お名前：</span>
              <span className="font-medium">{name}</span>
            </p>
            <p>
              <span className="text-gray-500">メール：</span>
              <span className="font-medium">{email}</span>
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              ご希望のプラン
              {suggestedPlan && (
                <span className="ml-2 text-xs text-green-700">
                  （アンケートのご回答を反映）
                </span>
              )}
            </p>
            <div className="space-y-2">
              {PLANS.map((p) => (
                <label
                  key={p.value}
                  className={`flex items-center justify-between border rounded-lg px-4 py-3 cursor-pointer transition ${
                    plan === p.value
                      ? "border-green-700 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="plan"
                      value={p.value}
                      checked={plan === p.value}
                      onChange={(e) => setPlan(e.target.value)}
                      className="accent-green-700"
                    />
                    <div>
                      <p className="font-medium text-sm">{p.label}</p>
                      <p className="text-xs text-gray-500">{p.desc}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-800">
                    {p.price}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">電話番号</span>
            <input
              type="tel"
              value={phoneVal}
              onChange={(e) => setPhoneVal(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-green-700 outline-none"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              ログインパスワード<span className="text-red-500 ml-1">*</span>
            </span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-green-700 outline-none"
              placeholder="8文字以上"
            />
          </label>

          <label className="flex items-start gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 accent-green-700"
            />
            <span>
              入会金・月会費（3ヶ月前払い）および利用規約に同意します
            </span>
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
            {loading ? "登録中..." : "入会する"}
          </button>
        </form>
      </div>
    </main>
  );
}

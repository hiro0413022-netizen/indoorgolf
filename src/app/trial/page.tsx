"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TrialApplicationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    preferredDate: "",
    source: "Web",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/trials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "送信に失敗しました");
      setLoading(false);
      return;
    }

    const trial = await res.json();
    router.push(`/trial/${trial.id}/thanks`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-sm text-green-700 font-semibold mb-1">STEP 1 / 3</p>
          <h1 className="text-2xl font-bold text-gray-900">無料体験のお申し込み</h1>
          <p className="text-gray-500 text-sm mt-2">
            シミュレーションゴルフを実際にお試しいただけます
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border p-6 space-y-4"
        >
          <Field label="お名前" required>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder="山田 太郎"
            />
          </Field>

          <Field label="メールアドレス" required>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
              placeholder="example@email.com"
            />
          </Field>

          <Field label="電話番号" required>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input"
              placeholder="090-1234-5678"
            />
          </Field>

          <Field label="体験希望日時">
            <input
              type="datetime-local"
              value={form.preferredDate}
              onChange={(e) =>
                setForm({ ...form, preferredDate: e.target.value })
              }
              className="input"
            />
          </Field>

          <Field label="当施設を知ったきっかけ">
            <select
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="input"
            >
              <option value="Web">Web検索</option>
              <option value="SNS">SNS</option>
              <option value="紹介">知人の紹介</option>
              <option value="チラシ">チラシ・看板</option>
              <option value="その他">その他</option>
            </select>
          </Field>

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
            {loading ? "送信中..." : "体験を申し込む"}
          </button>
        </form>
      </div>

      <style>{`
        .input {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          padding: 0.625rem 0.75rem;
          font-size: 0.95rem;
          outline: none;
        }
        .input:focus { border-color: #15803d; box-shadow: 0 0 0 2px #15803d22; }
      `}</style>
    </main>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-2">
            インドアゴルフ姫路
          </h1>
          <p className="text-gray-500 text-lg">会員管理・予約システム</p>
        </div>

        <Link
          href="/trial"
          className="block p-6 bg-green-700 text-white rounded-xl shadow hover:bg-green-800 transition-all mt-10"
        >
          <div className="text-3xl mb-2">🎟️</div>
          <h2 className="text-xl font-semibold mb-1">無料体験を申し込む</h2>
          <p className="text-sm text-green-100">
            体験 → アンケート → 入会の3ステップ
          </p>
        </Link>

        <p className="text-xs text-gray-400 mt-8 mb-2">— 管理メニュー —</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Link
            href="/admin/trials"
            className="block p-6 bg-white rounded-xl shadow hover:shadow-md border border-gray-200 hover:border-green-400 transition-all"
          >
            <div className="text-3xl mb-2">🎯</div>
            <h2 className="text-lg font-semibold mb-1">体験管理</h2>
            <p className="text-sm text-gray-500">申込・入会率の追跡</p>
          </Link>

          <Link
            href="/admin/members"
            className="block p-6 bg-white rounded-xl shadow hover:shadow-md border border-gray-200 hover:border-green-400 transition-all"
          >
            <div className="text-3xl mb-2">👥</div>
            <h2 className="text-lg font-semibold mb-1">会員管理</h2>
            <p className="text-sm text-gray-500">会員一覧・登録・プラン変更</p>
          </Link>

          <Link
            href="/admin/reservations"
            className="block p-6 bg-white rounded-xl shadow hover:shadow-md border border-gray-200 hover:border-green-400 transition-all"
          >
            <div className="text-3xl mb-2">📅</div>
            <h2 className="text-lg font-semibold mb-1">予約管理</h2>
            <p className="text-sm text-gray-500">打席予約・タイムテーブル</p>
          </Link>

          <Link
            href="/admin/billing"
            className="block p-6 bg-white rounded-xl shadow hover:shadow-md border border-gray-200 hover:border-amber-400 transition-all"
          >
            <div className="text-3xl mb-2">💰</div>
            <h2 className="text-lg font-semibold mb-1">打席料請求</h2>
            <p className="text-sm text-gray-500">月末まとめ請求（330円/回）</p>
          </Link>
        </div>
      </div>
    </main>
  );
}

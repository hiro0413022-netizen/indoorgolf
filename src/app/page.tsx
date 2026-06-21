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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
          <Link
            href="/admin/members"
            className="block p-6 bg-white rounded-xl shadow hover:shadow-md border border-gray-200 hover:border-green-400 transition-all"
          >
            <div className="text-3xl mb-2">👥</div>
            <h2 className="text-xl font-semibold mb-1">会員管理</h2>
            <p className="text-sm text-gray-500">会員一覧・登録・プラン変更</p>
          </Link>

          <Link
            href="/admin/reservations"
            className="block p-6 bg-white rounded-xl shadow hover:shadow-md border border-gray-200 hover:border-green-400 transition-all"
          >
            <div className="text-3xl mb-2">📅</div>
            <h2 className="text-xl font-semibold mb-1">予約管理</h2>
            <p className="text-sm text-gray-500">打席予約・タイムテーブル</p>
          </Link>
        </div>
      </div>
    </main>
  );
}

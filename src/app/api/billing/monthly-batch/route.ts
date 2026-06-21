import { NextRequest, NextResponse } from "next/server";
import { runMonthlyBayFeeBilling } from "@/lib/billing";

/**
 * 月末まとめ請求バッチ（打席料330円/回 + 同伴者料金）。
 * 管理者が月末に1回実行する。CRON や GitHub Actions からも叩ける。
 *
 * Authorization: Bearer <BILLING_API_SECRET> で保護。
 * body（任意）: { year: 2026, month: 6 }  省略時は前月。
 */
export async function POST(req: NextRequest) {
  // 簡易 Bearer 認証（本番では next-auth セッションチェックに差し替える）
  const secret = process.env.BILLING_API_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
    }
  }

  let year: number | undefined;
  let month: number | undefined;

  const body = await req.text();
  if (body) {
    try {
      const parsed = JSON.parse(body);
      year = parsed.year ? Number(parsed.year) : undefined;
      month = parsed.month ? Number(parsed.month) : undefined;
    } catch {
      // body なしでも OK
    }
  }

  let results;
  try {
    results = await runMonthlyBayFeeBilling(year, month);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: err instanceof Error && err.message.includes("未設定") ? 503 : 500 }
    );
  }

  const succeeded = results.filter((r) => !r.skipped);
  const skipped = results.filter((r) => r.skipped);
  const totalBilled = succeeded.reduce((s, r) => s + r.totalAmount, 0);

  return NextResponse.json({
    ok: true,
    summary: {
      totalMembers: results.length,
      succeededCount: succeeded.length,
      skippedCount: skipped.length,
      totalBilledAmount: totalBilled,
    },
    results,
  });
}

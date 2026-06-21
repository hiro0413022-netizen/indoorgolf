import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStripe } from "@/lib/stripe";
import { SubscriptionStatus } from "@prisma/client";

/** サブスクリプションの解約（期間終了時にキャンセル） */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let stripe;
  try {
    stripe = requireStripe();
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 503 });
  }

  const { id } = await params;
  const member = await prisma.member.findUnique({ where: { id } });
  if (!member?.stripeSubscriptionId) {
    return NextResponse.json(
      { error: "有効なサブスクリプションがありません" },
      { status: 404 }
    );
  }

  await stripe.subscriptions.update(member.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  await prisma.member.update({
    where: { id },
    data: { subscriptionStatus: SubscriptionStatus.CANCELED },
  });

  return NextResponse.json({ ok: true, message: "期間終了時に解約されます" });
}

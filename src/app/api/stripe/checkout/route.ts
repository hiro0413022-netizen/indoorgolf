import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStripe, APP_URL } from "@/lib/stripe";
import { STRIPE_PRICE_BY_PLAN } from "@/lib/plans";
import { MemberPlan } from "@prisma/client";

/**
 * 会員の月会費サブスクリプション用 Stripe Checkout セッションを作成する。
 * body: { memberId: string }
 * 返り値の url にリダイレクトすると決済画面に遷移する。
 */
export async function POST(req: NextRequest) {
  let stripe;
  try {
    stripe = requireStripe();
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 503 }
    );
  }

  const { memberId } = await req.json();
  if (!memberId) {
    return NextResponse.json({ error: "memberId は必須です" }, { status: 400 });
  }

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) {
    return NextResponse.json({ error: "会員が見つかりません" }, { status: 404 });
  }

  const priceId = STRIPE_PRICE_BY_PLAN[member.plan as MemberPlan];
  if (!priceId) {
    return NextResponse.json(
      { error: `プラン ${member.plan} の Stripe Price ID が未設定です` },
      { status: 503 }
    );
  }

  // Stripe Customer を用意（なければ作成して保存）
  let customerId = member.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: member.email,
      name: member.name,
      metadata: { memberId: member.id },
    });
    customerId = customer.id;
    await prisma.member.update({
      where: { id: member.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/admin/members/${member.id}?checkout=success`,
    cancel_url: `${APP_URL}/admin/members/${member.id}?checkout=cancel`,
    metadata: { memberId: member.id },
    subscription_data: { metadata: { memberId: member.id } },
  });

  return NextResponse.json({ url: session.url });
}

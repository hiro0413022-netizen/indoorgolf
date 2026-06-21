import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { planFromPriceId } from "@/lib/plans";
import {
  MemberPlan,
  PaymentStatus,
  PaymentType,
  SubscriptionStatus,
} from "@prisma/client";
import type Stripe from "stripe";

// 署名検証のため raw body が必要
export const runtime = "nodejs";

const STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: SubscriptionStatus.ACTIVE,
  trialing: SubscriptionStatus.ACTIVE,
  past_due: SubscriptionStatus.PAST_DUE,
  unpaid: SubscriptionStatus.PAST_DUE,
  canceled: SubscriptionStatus.CANCELED,
  incomplete_expired: SubscriptionStatus.CANCELED,
};

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe 未設定" }, { status: 503 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    if (!secret || !signature) {
      throw new Error("Webhook secret / signature missing");
    }
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `署名検証に失敗しました: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const memberId = session.metadata?.memberId;
        if (memberId && session.subscription) {
          await prisma.member.update({
            where: { id: memberId },
            data: {
              stripeSubscriptionId: session.subscription as string,
              subscriptionStatus: SubscriptionStatus.ACTIVE,
            },
          });
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await recordInvoicePayment(invoice, PaymentStatus.PAID);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await recordInvoicePayment(invoice, PaymentStatus.FAILED);
        const member = await memberFromCustomer(invoice.customer as string);
        if (member) {
          await prisma.member.update({
            where: { id: member.id },
            data: { subscriptionStatus: SubscriptionStatus.PAST_DUE },
          });
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const member = await memberFromCustomer(sub.customer as string);
        if (member) {
          const priceId = sub.items.data[0]?.price.id;
          const plan = priceId ? planFromPriceId(priceId) : null;
          const periodEnd = (sub as unknown as { current_period_end?: number })
            .current_period_end;
          await prisma.member.update({
            where: { id: member.id },
            data: {
              subscriptionStatus:
                STATUS_MAP[sub.status] ?? SubscriptionStatus.NONE,
              ...(plan ? { plan: plan as MemberPlan } : {}),
              ...(periodEnd
                ? { currentPeriodEnd: new Date(periodEnd * 1000) }
                : {}),
            },
          });
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook 処理エラー:", err);
    return NextResponse.json(
      { error: "処理に失敗しました" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

async function memberFromCustomer(customerId: string) {
  return prisma.member.findUnique({ where: { stripeCustomerId: customerId } });
}

/** 請求書（月会費）を Payment に冪等に記録し、有効期限を更新する */
async function recordInvoicePayment(
  invoice: Stripe.Invoice,
  status: PaymentStatus
) {
  const member = await memberFromCustomer(invoice.customer as string);
  if (!member) return;

  // stripeInvoiceId の unique 制約で二重記録を防止
  const existing = await prisma.payment.findUnique({
    where: { stripeInvoiceId: invoice.id },
  });
  if (existing) return;

  await prisma.payment.create({
    data: {
      memberId: member.id,
      amount: invoice.amount_paid || invoice.amount_due || 0,
      type: PaymentType.MONTHLY_FEE,
      status,
      stripeInvoiceId: invoice.id,
      paidAt: status === PaymentStatus.PAID ? new Date() : null,
      description: "月会費",
    },
  });

  if (status === PaymentStatus.PAID) {
    const periodEnd = (
      invoice as unknown as { lines?: { data?: { period?: { end?: number } }[] } }
    ).lines?.data?.[0]?.period?.end;
    await prisma.member.update({
      where: { id: member.id },
      data: {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        ...(periodEnd
          ? { currentPeriodEnd: new Date(periodEnd * 1000) }
          : {}),
      },
    });
  }
}

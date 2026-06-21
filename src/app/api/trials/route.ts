import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TrialStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const trials = await prisma.trial.findMany({
    where: status ? { status: status as TrialStatus } : {},
    include: {
      survey: { select: { id: true, satisfaction: true, joinIntent: true } },
      member: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(trials);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, phone, preferredDate, source } = body;

  if (!name || !email || !phone) {
    return NextResponse.json(
      { error: "お名前・メールアドレス・電話番号は必須です" },
      { status: 400 }
    );
  }

  const trial = await prisma.trial.create({
    data: {
      name,
      email,
      phone,
      preferredDate: preferredDate ? new Date(preferredDate) : null,
      source: source ?? "Web",
    },
  });

  return NextResponse.json(trial, { status: 201 });
}

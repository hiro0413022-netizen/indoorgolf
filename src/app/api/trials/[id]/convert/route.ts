import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MemberPlan, TrialStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

/// 体験申し込みを正式会員に変換する（ファネルの最終段階）
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { plan, password, phone } = body;

  const trial = await prisma.trial.findUnique({
    where: { id },
    include: { member: true },
  });
  if (!trial) {
    return NextResponse.json({ error: "体験申し込みが見つかりません" }, { status: 404 });
  }
  if (trial.member) {
    return NextResponse.json(
      { error: "この体験申し込みは既に入会済みです" },
      { status: 409 }
    );
  }
  if (!password) {
    return NextResponse.json({ error: "パスワードは必須です" }, { status: 400 });
  }

  const existing = await prisma.member.findUnique({
    where: { email: trial.email },
  });
  if (existing) {
    return NextResponse.json(
      { error: "このメールアドレスは既に会員登録されています" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const joinedAt = new Date();
  const expiresAt = new Date(joinedAt);
  expiresAt.setMonth(expiresAt.getMonth() + 3); // 3ヶ月前払い

  const member = await prisma.$transaction(async (tx) => {
    const created = await tx.member.create({
      data: {
        name: trial.name,
        email: trial.email,
        phone: phone ?? trial.phone,
        plan: (plan as MemberPlan) ?? MemberPlan.REGULAR,
        passwordHash,
        joinedAt,
        expiresAt,
        trialId: trial.id,
      },
      select: { id: true, name: true, email: true, plan: true },
    });

    await tx.trial.update({
      where: { id: trial.id },
      data: { status: TrialStatus.CONVERTED },
    });

    return created;
  });

  return NextResponse.json(member, { status: 201 });
}

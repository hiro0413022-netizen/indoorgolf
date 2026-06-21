import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { MemberPlan } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const plan = searchParams.get("plan");

  const members = await prisma.member.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(plan ? { plan: plan as MemberPlan } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      plan: true,
      status: true,
      joinedAt: true,
      expiresAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(members);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, phone, plan, password } = body;

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "name, email, password は必須です" },
      { status: 400 }
    );
  }

  const existing = await prisma.member.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "このメールアドレスは既に登録されています" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const joinedAt = new Date();
  // 3ヶ月前払いで有効期限を設定
  const expiresAt = new Date(joinedAt);
  expiresAt.setMonth(expiresAt.getMonth() + 3);

  const member = await prisma.member.create({
    data: {
      name,
      email,
      phone,
      plan: plan ?? MemberPlan.REGULAR,
      passwordHash,
      joinedAt,
      expiresAt,
    },
    select: {
      id: true,
      name: true,
      email: true,
      plan: true,
      status: true,
      joinedAt: true,
      expiresAt: true,
    },
  });

  return NextResponse.json(member, { status: 201 });
}

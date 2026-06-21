import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MemberPlan, MemberStatus } from "@prisma/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      reservations: {
        orderBy: { startAt: "desc" },
        take: 10,
      },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!member) {
    return NextResponse.json({ error: "会員が見つかりません" }, { status: 404 });
  }

  const { passwordHash: _, ...safeData } = member;
  return NextResponse.json(safeData);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { name, phone, plan, status, expiresAt } = body;

  const member = await prisma.member.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(plan ? { plan: plan as MemberPlan } : {}),
      ...(status ? { status: status as MemberStatus } : {}),
      ...(expiresAt ? { expiresAt: new Date(expiresAt) } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      plan: true,
      status: true,
      expiresAt: true,
    },
  });

  return NextResponse.json(member);
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TrialStatus } from "@prisma/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const trial = await prisma.trial.findUnique({
    where: { id },
    include: { survey: true, member: { select: { id: true } } },
  });

  if (!trial) {
    return NextResponse.json({ error: "体験申し込みが見つかりません" }, { status: 404 });
  }

  return NextResponse.json(trial);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { status, preferredDate, notes } = body;

  const trial = await prisma.trial.update({
    where: { id },
    data: {
      ...(status ? { status: status as TrialStatus } : {}),
      ...(preferredDate ? { preferredDate: new Date(preferredDate) } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
  });

  return NextResponse.json(trial);
}

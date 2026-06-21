import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MemberPlan, TrialStatus } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const {
    satisfaction,
    simulatorScore,
    staffScore,
    joinIntent,
    interestedPlan,
    comment,
  } = body;

  const trial = await prisma.trial.findUnique({
    where: { id },
    include: { survey: true },
  });
  if (!trial) {
    return NextResponse.json({ error: "体験申し込みが見つかりません" }, { status: 404 });
  }
  if (trial.survey) {
    return NextResponse.json(
      { error: "アンケートは既に回答済みです" },
      { status: 409 }
    );
  }

  const scores = [satisfaction, simulatorScore, staffScore, joinIntent];
  if (scores.some((s) => typeof s !== "number" || s < 1 || s > 5)) {
    return NextResponse.json(
      { error: "各評価は1〜5で入力してください" },
      { status: 400 }
    );
  }

  const survey = await prisma.trialSurvey.create({
    data: {
      trialId: id,
      satisfaction,
      simulatorScore,
      staffScore,
      joinIntent,
      interestedPlan: interestedPlan
        ? (interestedPlan as MemberPlan)
        : null,
      comment,
    },
  });

  // 体験を実施済みに更新（未完了の場合）
  if (trial.status === TrialStatus.APPLIED || trial.status === TrialStatus.SCHEDULED) {
    await prisma.trial.update({
      where: { id },
      data: { status: TrialStatus.COMPLETED },
    });
  }

  return NextResponse.json(survey, { status: 201 });
}

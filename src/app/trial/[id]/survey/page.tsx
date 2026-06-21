import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import SurveyForm from "./SurveyForm";

export default async function SurveyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trial = await prisma.trial.findUnique({
    where: { id },
    include: { survey: true },
  });
  if (!trial) notFound();

  // 回答済みなら会員登録ステップへ
  if (trial.survey) {
    redirect(`/trial/${id}/register`);
  }

  return <SurveyForm trialId={id} name={trial.name} />;
}

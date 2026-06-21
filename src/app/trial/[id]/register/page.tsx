import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import RegisterForm from "./RegisterForm";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trial = await prisma.trial.findUnique({
    where: { id },
    include: { survey: true, member: { select: { id: true } } },
  });
  if (!trial) notFound();

  // 既に入会済みなら完了画面へ
  if (trial.member) {
    redirect(`/trial/${id}/done`);
  }

  return (
    <RegisterForm
      trialId={id}
      name={trial.name}
      email={trial.email}
      phone={trial.phone}
      suggestedPlan={trial.survey?.interestedPlan ?? null}
    />
  );
}

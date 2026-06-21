import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ReservationStatus } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  if (!status || !Object.values(ReservationStatus).includes(status)) {
    return NextResponse.json({ error: "無効なステータスです" }, { status: 400 });
  }

  const reservation = await prisma.reservation.update({
    where: { id },
    data: { status },
    include: {
      member: { select: { name: true } },
      bay: { select: { number: true, name: true } },
    },
  });

  return NextResponse.json(reservation);
}

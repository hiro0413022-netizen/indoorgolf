import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const bays = await prisma.bay.findMany({
    where: { isActive: true },
    orderBy: { number: "asc" },
  });
  return NextResponse.json(bays);
}

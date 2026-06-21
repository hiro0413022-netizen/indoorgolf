import { PrismaClient, MemberPlan } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import path from "path";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const adapter = url?.startsWith("libsql://")
  ? new PrismaLibSql({ url, authToken })
  : new PrismaLibSql({ url: `file:${path.resolve(process.cwd(), "dev.db")}` });

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.bay.upsert({
    where: { number: 1 },
    update: {},
    create: { number: 1, name: "打席1番" },
  });
  await prisma.bay.upsert({
    where: { number: 2 },
    update: {},
    create: { number: 2, name: "打席2番" },
  });
  await prisma.bay.upsert({
    where: { number: 3 },
    update: {},
    create: { number: 3, name: "打席3番" },
  });

  const hash = await bcrypt.hash("password123", 12);
  const members = [
    {
      name: "山田 太郎",
      email: "yamada@example.com",
      phone: "090-1234-5678",
      plan: MemberPlan.REGULAR,
    },
    {
      name: "田中 花子",
      email: "tanaka@example.com",
      phone: "090-8765-4321",
      plan: MemberPlan.MASTER,
    },
    {
      name: "鈴木 一郎",
      email: "suzuki@example.com",
      phone: "090-1111-2222",
      plan: MemberPlan.LESSON,
    },
  ];

  for (const m of members) {
    await prisma.member.upsert({
      where: { email: m.email },
      update: {},
      create: {
        ...m,
        passwordHash: hash,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log("✅ シードデータを投入しました（打席3台、会員3名）");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

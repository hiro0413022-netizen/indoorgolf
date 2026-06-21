import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

function createPrismaClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  let adapter: PrismaLibSql;
  if (url && url.startsWith("libsql://")) {
    // 本番: Turso クラウドDB
    adapter = new PrismaLibSql({ url, authToken });
  } else {
    // 開発: ローカルSQLiteファイル
    const dbPath = path.resolve(process.cwd(), "dev.db");
    adapter = new PrismaLibSql({ url: `file:${dbPath}` });
  }

  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

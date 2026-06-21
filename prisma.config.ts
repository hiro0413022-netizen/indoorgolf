import "dotenv/config";
import { defineConfig } from "prisma/config";

const isTurso =
  process.env.TURSO_DATABASE_URL?.startsWith("libsql://");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: isTurso
    ? {
        // 本番: Turso クラウドDB
        url: process.env.TURSO_DATABASE_URL,
        // Turso 用アダプター認証は PrismaClient 側で渡すので、ここは URL のみ
      }
    : {
        // 開発: ローカルファイル
        url: `file:${process.cwd()}/dev.db`,
      },
});

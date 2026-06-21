// Turso にテーブル一式＋初期データを作成するスクリプト
// 使い方:
//   TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="ey..." node scripts/turso-init.mjs
import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import path from "path";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("TURSO_DATABASE_URL と TURSO_AUTH_TOKEN を環境変数で指定してください");
  process.exit(1);
}

const client = createClient({ url, authToken });

const sql = readFileSync(
  path.resolve(process.cwd(), "prisma/turso-setup.sql"),
  "utf8"
);

// コメント行を除去し、セミコロンごとに分割して実行
const statements = sql
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n")
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

for (const stmt of statements) {
  await client.execute(stmt);
  console.log("OK:", stmt.split("\n")[0].slice(0, 60));
}

const bays = await client.execute('SELECT * FROM "Bay"');
console.log(`\n完了。打席テーブルの行数: ${bays.rows.length}`);

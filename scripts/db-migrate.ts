// db/migrations/*.sql を番号順に流す。流したものは schema_migrations に記録し、2回目以降は飛ばす。
// 実行: npm run db:migrate            (DATABASE_URL は .env.local から読む)
//       npm run db:migrate -- --seed  (あわせて初期データ db/seed.sql も流す)
// 本番(Neon)に流すときは DATABASE_URL=<Neon の URL> npm run db:migrate のように指定する。

import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL を設定してください");
  const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });

  try {
    await sql`create table if not exists schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )`;
    const applied = new Set((await sql<{ name: string }[]>`select name from schema_migrations`).map((r) => r.name));

    const dir = path.join(process.cwd(), "db/migrations");
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
      if (applied.has(file)) continue;
      const body = fs.readFileSync(path.join(dir, file), "utf-8");
      await sql.begin(async (tx) => {
        await tx.unsafe(body);
        await tx`insert into schema_migrations (name) values (${file})`;
      });
      console.log(`適用: ${file}`);
    }

    if (process.argv.includes("--seed")) {
      await sql.unsafe(fs.readFileSync(path.join(process.cwd(), "db/seed.sql"), "utf-8"));
      console.log("初期データ(db/seed.sql)を流しました(既にある slug は飛ばします)");
    }
    console.log("完了");
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});

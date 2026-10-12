import "server-only";

import postgres from "postgres";

// DB の接続。ローカルは Docker の PostgreSQL、本番は Neon(どちらも DATABASE_URL で指定する)。
// DATABASE_URL が未設定のときは、公開サイトは静的データで動き、管理画面は使えない。

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

// 開発中のホットリロードやサーバーレスの再利用で接続を作りすぎないよう、プロセスで1つにする
const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

export function getSql(): postgres.Sql {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL が設定されていません");
  }
  globalForDb.sql ??= postgres(process.env.DATABASE_URL, {
    max: 5,
    // Neon の接続プール(-pooler の URL)はトランザクション単位で接続を使い回すため、prepared statement を使わない
    prepare: false,
  });
  return globalForDb.sql;
}

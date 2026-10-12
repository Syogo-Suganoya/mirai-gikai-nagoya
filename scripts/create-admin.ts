// 管理者アカウントを作る(すでにあればパスワードを変える)。
// 実行: npm run admin:create -- <メールアドレス>
// パスワードは実行中に入力する(コマンド履歴に残さないため引数では受け取らない)。
// 接続先は DATABASE_URL(.env.local)。本番の Neon に作るときは DATABASE_URL=<Neon の URL> を付けて実行する。

import postgres from "postgres";
import readline from "node:readline/promises";

const MIN_PASSWORD_LENGTH = 10;

async function main() {
  const email = process.argv[2];
  const url = process.env.DATABASE_URL;
  if (!email) throw new Error("使い方: npm run admin:create -- <メールアドレス>");
  if (!url) throw new Error("DATABASE_URL を設定してください");

  // .env.local の LOCAL_ADMIN_PASSWORD は、ローカルの DB に接続しているときだけ使う
  // (本番の URL で実行したときに、ローカル確認用のパスワードで本番の管理者を作らないため)
  const isLocal = /@(127\.0\.0\.1|localhost)(:|\/)/.test(url);
  const password =
    (isLocal ? process.env.LOCAL_ADMIN_PASSWORD : undefined) ??
    (await readline
      .createInterface({ input: process.stdin, output: process.stdout })
      .question(`パスワード(${MIN_PASSWORD_LENGTH}文字以上): `));
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`パスワードは${MIN_PASSWORD_LENGTH}文字以上にしてください`);
  }

  const sql = postgres(url, { max: 1, prepare: false });
  try {
    const [row] = await sql<{ inserted: boolean }[]>`
      insert into admins (email, password_hash) values (${email}, crypt(${password}, gen_salt('bf')))
      on conflict (lower(email)) do update set password_hash = excluded.password_hash
      returning (xmax = 0) as inserted
    `;
    console.log(row.inserted ? `管理者 ${email} を作成しました` : `既存の管理者 ${email} のパスワードを変更しました`);
  } finally {
    await sql.end();
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});

import "server-only";

import { randomInt } from "node:crypto";
import type { PostgresError } from "postgres";
import { getSql } from "@/lib/db";

export type AdminSummary = {
  id: string;
  email: string;
  createdAt: string;
  lastLoginAt: string | null;
};

export async function listAdmins(): Promise<AdminSummary[]> {
  const rows = await getSql()<{ id: string; email: string; created_at: Date; last_login_at: Date | null }[]>`
    select id, email, created_at, last_login_at from admins order by created_at
  `;
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    createdAt: r.created_at.toISOString(),
    lastLoginAt: r.last_login_at?.toISOString() ?? null,
  }));
}

// 長さや文字の種類の制約は設けない(空欄だけは不可)
function checkPassword(password: string) {
  if (password.length === 0) throw new Error("パスワードを入力してください");
}

// 初期パスワード用。見間違えやすい文字(0/O, 1/l/I など)を除いた英数字16文字
const PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function generatePassword(length = 16): string {
  return Array.from({ length }, () => PASSWORD_CHARS[randomInt(PASSWORD_CHARS.length)]).join("");
}

// 初期パスワードは自動で発行し、呼び出し元に一度だけ返す(DB には bcrypt のハッシュしか残らない)。
// パスワードは DB 側で bcrypt にする(Neon の SQL エディタで追加する場合と同じ方式)
export async function createAdmin(email: string): Promise<{ password: string }> {
  const trimmed = email.trim();
  if (!/^[^@\s]+@[^@\s]+$/.test(trimmed)) throw new Error("メールアドレスの形式が正しくありません");
  const password = generatePassword();
  try {
    await getSql()`
      insert into admins (email, password_hash, must_change_password)
      values (${trimmed}, crypt(${password}, gen_salt('bf')), true)
    `;
  } catch (e) {
    if ((e as PostgresError).code === "23505") throw new Error("このメールアドレスの管理者はすでにいます");
    throw e;
  }
  return { password };
}

// パスワードを変えたら、その管理者のログイン中のセッションはすべて無効にする。
// 他の管理者が設定したパスワード(setByOther)なら、本人の次回ログイン時に変更を求める
export async function changePassword(adminId: string, password: string, setByOther: boolean): Promise<void> {
  checkPassword(password);
  const sql = getSql();
  await sql.begin(async (tx) => {
    await tx`
      update admins set password_hash = crypt(${password}, gen_salt('bf')), must_change_password = ${setByOther}
      where id = ${adminId}
    `;
    await tx`delete from admin_sessions where admin_id = ${adminId}`;
  });
}

// 初回ログイン時の変更。今のセッション(keepTokenHash)はそのまま使えるようにし、他のセッションは無効にする
export async function changeInitialPassword(adminId: string, password: string, keepTokenHash: string): Promise<void> {
  checkPassword(password);
  const sql = getSql();
  const [{ same }] = await sql<{ same: boolean }[]>`
    select password_hash = crypt(${password}, password_hash) as same from admins where id = ${adminId}
  `;
  if (same) throw new Error("今のパスワードとは別のパスワードにしてください");
  await sql.begin(async (tx) => {
    await tx`
      update admins set password_hash = crypt(${password}, gen_salt('bf')), must_change_password = false
      where id = ${adminId}
    `;
    await tx`delete from admin_sessions where admin_id = ${adminId} and token_hash <> ${keepTokenHash}`;
  });
}

// パスワードを自動で発行し直す(初期パスワードの再発行)。ログイン中のセッションは無効になる
export async function reissuePassword(adminId: string): Promise<{ email: string; password: string }> {
  const [admin] = await getSql()<{ email: string }[]>`select email from admins where id = ${adminId}`;
  if (!admin) throw new Error("管理者が見つかりません");
  const password = generatePassword();
  await changePassword(adminId, password, true);
  return { email: admin.email, password };
}

// 最後の1人は消せない(管理画面に誰も入れなくなるため)。セッションは ON DELETE CASCADE で消える
export async function deleteAdmin(adminId: string): Promise<void> {
  const sql = getSql();
  await sql.begin(async (tx) => {
    const [{ count }] = await tx<{ count: number }[]>`select count(*)::int as count from admins`;
    if (count <= 1) throw new Error("最後の管理者は削除できません");
    await tx`delete from admins where id = ${adminId}`;
  });
}

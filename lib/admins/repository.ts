import "server-only";

import type { PostgresError } from "postgres";
import { getSql } from "@/lib/db";

export type AdminSummary = {
  id: string;
  email: string;
  createdAt: string;
  lastLoginAt: string | null;
};

export const MIN_PASSWORD_LENGTH = 10;

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

function checkPassword(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`パスワードは${MIN_PASSWORD_LENGTH}文字以上にしてください`);
  }
}

// パスワードは DB 側で bcrypt にする(Neon の SQL エディタで追加する場合と同じ方式)
export async function createAdmin(email: string, password: string): Promise<void> {
  const trimmed = email.trim();
  if (!/^[^@\s]+@[^@\s]+$/.test(trimmed)) throw new Error("メールアドレスの形式が正しくありません");
  checkPassword(password);
  try {
    await getSql()`insert into admins (email, password_hash) values (${trimmed}, crypt(${password}, gen_salt('bf')))`;
  } catch (e) {
    if ((e as PostgresError).code === "23505") throw new Error("このメールアドレスの管理者はすでにいます");
    throw e;
  }
}

// パスワードを変えたら、その管理者のログイン中のセッションはすべて無効にする
export async function changePassword(adminId: string, password: string): Promise<void> {
  checkPassword(password);
  const sql = getSql();
  await sql.begin(async (tx) => {
    await tx`update admins set password_hash = crypt(${password}, gen_salt('bf')) where id = ${adminId}`;
    await tx`delete from admin_sessions where admin_id = ${adminId}`;
  });
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

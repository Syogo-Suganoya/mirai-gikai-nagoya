import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSql, isDbConfigured } from "@/lib/db";

// 管理画面の簡易ログイン。
// - パスワードは DB の pgcrypto(bcrypt)でハッシュ化して保存し、照合も DB で行う
// - ログインに成功したらランダムなトークンを Cookie に入れ、DB にはその SHA-256 だけを保存する
//   (DB が漏れてもトークンを再現できない。ログアウトや管理者の削除で即座に無効になる)

export const SESSION_COOKIE = "admin_session";
const SESSION_DAYS = 7;

export type Admin = {
  id: string;
  email: string;
};

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

// メールアドレスとパスワードが合っていれば、その管理者を返す
export async function verifyPassword(email: string, password: string): Promise<Admin | null> {
  const [admin] = await getSql()<Admin[]>`
    select id, email from admins
    where lower(email) = lower(${email}) and password_hash = crypt(${password}, password_hash)
  `;
  return admin ?? null;
}

export async function startSession(adminId: string): Promise<void> {
  const sql = getSql();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await sql`insert into admin_sessions (admin_id, token_hash, expires_at) values (${adminId}, ${hashToken(token)}, ${expiresAt})`;
  await sql`update admins set last_login_at = now() where id = ${adminId}`;
  // 期限切れのセッションはついでに掃除する
  await sql`delete from admin_sessions where expires_at < now()`;

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await getSql()`delete from admin_sessions where token_hash = ${hashToken(token)}`;
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentAdmin(): Promise<Admin | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [admin] = await getSql()<Admin[]>`
    select a.id, a.email from admin_sessions s
    join admins a on a.id = s.admin_id
    where s.token_hash = ${hashToken(token)} and s.expires_at > now()
  `;
  return admin ?? null;
}

// Server Action の先頭で呼ぶ。proxy.ts は Cookie の有無しか見ないので、ここで必ず DB と照合する
export async function requireAdmin(): Promise<Admin> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("管理者としてログインしてください");
  return admin;
}

// 管理画面のページ(レイアウト・各ページ)の先頭で呼ぶ。DB 未設定・未ログインならログイン画面へ送る
// (ページでは例外を投げずにリダイレクトする。requireAdmin は Server Action 用)
export async function requireAdminPage(): Promise<Admin> {
  if (!isDbConfigured()) redirect("/admin/login");
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

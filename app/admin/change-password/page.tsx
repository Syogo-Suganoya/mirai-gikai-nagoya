import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { isDbConfigured } from "@/lib/db";
import { signOut } from "../actions";
import ChangePasswordForm from "./change-password-form";

export const metadata = { title: "パスワード変更 | 管理画面" };

// ログイン状態で表示が変わるので、ビルド時に静的生成しない
export const dynamic = "force-dynamic";

// 初回ログイン時(自動発行されたパスワードのまま)のパスワード変更画面。変更するまで他の管理画面には入れない
export default async function ChangePasswordPage() {
  if (!isDbConfigured()) redirect("/admin/login");
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (!admin.mustChangePassword) redirect("/admin");

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-bold">パスワードの変更</h1>
        <p className="mt-1 text-xs text-zinc-500">{admin.email}</p>
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          発行されたパスワードでログインしています。管理画面を使う前に、自分で決めたパスワードに変更してください。
        </p>
        <ChangePasswordForm />
        <form action={signOut} className="mt-4 text-center">
          <button type="submit" className="text-xs text-zinc-500 hover:underline">
            ログアウト
          </button>
        </form>
      </div>
    </div>
  );
}

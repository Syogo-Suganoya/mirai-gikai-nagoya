import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { isDbConfigured } from "@/lib/db";
import LoginForm from "./login-form";

export const metadata = { title: "ログイン | 管理画面" };

// DB の設定とログイン状態で表示が変わるので、ビルド時に静的生成しない
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ changed?: string }>;
}) {
  const { changed } = await searchParams;
  // ログイン済みならそのまま管理画面へ
  if (isDbConfigured() && (await getCurrentAdmin())) redirect("/admin");

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-bold">管理画面ログイン</h1>
        <p className="mt-1 text-xs text-zinc-500">みらい議会＠愛知・名古屋</p>
        {!isDbConfigured() ? (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            DB(DATABASE_URL)が設定されていないため、管理画面は使えません。_memo/DEPLOY.md
            の手順で設定してください。
          </p>
        ) : (
          <>
            {changed && (
              <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                パスワードを変更しました。新しいパスワードでログインしてください。
              </p>
            )}
            <LoginForm />
          </>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/admin";
import { signOut } from "../actions";

export const metadata = { title: "管理画面 | みらい議会＠愛知・名古屋" };

// ログイン状態と DB の内容で毎回変わるので、ビルド時に静的生成しない
export const dynamic = "force-dynamic";

const nav = [
  { href: "/admin", label: "議案管理" },
  { href: "/admin/agendas", label: "議案一覧から作成" },
  { href: "/admin/import", label: "CSVインポート" },
  { href: "/admin/admins", label: "管理者" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // proxy.ts は Cookie の有無しか見ないので、ここで DB のセッションと照合する
  const admin = await requireAdminPage();

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/admin" className="font-bold">
            🏯 管理画面
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="text-zinc-600 hover:text-amber-700">
                {item.label}
              </Link>
            ))}
            <a href="/" target="_blank" className="text-zinc-600 hover:text-amber-700">
              公開サイト ↗
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-xs text-zinc-500">
            <span>{admin.email}</span>
            <form action={signOut}>
              <button type="submit" className="rounded border border-zinc-300 px-2 py-1 hover:bg-zinc-100">
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}

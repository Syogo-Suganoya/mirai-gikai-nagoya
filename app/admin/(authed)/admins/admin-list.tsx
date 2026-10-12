"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { AdminSummary } from "@/lib/admins/repository";
import {
  changeAdminPasswordAction,
  createAdminAction,
  deleteAdminAction,
  type ActionResult,
} from "../../actions";

const inputClass = "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm";
const toDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }) : "—";

export default function AdminList({
  admins,
  myId,
  minPasswordLength,
}: {
  admins: AdminSummary[];
  myId: string;
  minPasswordLength: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const run = (action: () => Promise<ActionResult>, okText: string, after?: () => void) =>
    startTransition(async () => {
      setMessage(null);
      const result = await action();
      if (!result.ok) return setMessage({ ok: false, text: result.error });
      setMessage({ ok: true, text: okText });
      after?.();
      router.refresh();
    });

  return (
    <div className="mt-5 space-y-5">
      {message && (
        <p className={`rounded-lg p-3 text-sm ${message.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>
          {message.text}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs text-zinc-500">
            <tr>
              <th className="px-3 py-2">メールアドレス</th>
              <th className="px-3 py-2">作成日時</th>
              <th className="px-3 py-2">最終ログイン</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {admins.map((a) => (
              <tr key={a.id} className="align-top">
                <td className="px-3 py-3">
                  {a.email}
                  {a.id === myId && <span className="ml-2 rounded bg-zinc-100 px-1.5 text-xs text-zinc-500">自分</span>}
                  {editingId === a.id && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={`新しいパスワード(${minPasswordLength}文字以上)`}
                        autoComplete="new-password"
                        className={`${inputClass} min-w-56 flex-1`}
                      />
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          a.id === myId
                            ? // 自分のパスワードを変えるとセッションが消えるので、ログイン画面へ移動して案内する
                              startTransition(async () => {
                                const result = await changeAdminPasswordAction(a.id, newPassword);
                                if (!result.ok) return setMessage({ ok: false, text: result.error });
                                router.push("/admin/login?changed=1");
                              })
                            : run(
                                () => changeAdminPasswordAction(a.id, newPassword),
                                "パスワードを変更しました(この管理者はログインし直しになります)",
                                () => {
                                  setEditingId(null);
                                  setNewPassword("");
                                },
                              )
                        }
                        className="rounded-lg bg-zinc-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                      >
                        変更する
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-3 py-3 text-xs text-zinc-500">{toDate(a.createdAt)}</td>
                <td className="px-3 py-3 text-xs text-zinc-500">{toDate(a.lastLoginAt)}</td>
                <td className="whitespace-nowrap px-3 py-3 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(editingId === a.id ? null : a.id);
                      setNewPassword("");
                    }}
                    className="text-amber-700 hover:underline"
                  >
                    パスワード変更
                  </button>
                  {a.id !== myId && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        if (confirm(`${a.email} を管理者から削除します。よろしいですか?`)) {
                          run(() => deleteAdminAction(a.id), `${a.email} を削除しました`);
                        }
                      }}
                      className="ml-3 text-rose-600 hover:underline disabled:opacity-40"
                    >
                      削除
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        className="rounded-xl border border-zinc-200 bg-white p-4"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => createAdminAction(email, password), `${email} を管理者に追加しました`, () => {
            setEmail("");
            setPassword("");
          });
        }}
      >
        <h2 className="font-semibold">管理者を追加</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレス"
            autoComplete="off"
            className={`${inputClass} min-w-56 flex-1`}
          />
          <input
            type="password"
            required
            minLength={minPasswordLength}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={`初期パスワード(${minPasswordLength}文字以上)`}
            autoComplete="new-password"
            className={`${inputClass} min-w-56 flex-1`}
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-40"
          >
            追加
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          追加した人には、初期パスワードを安全な方法で伝え、ログイン後に「パスワード変更」で変えてもらってください。
        </p>
      </form>
    </div>
  );
}

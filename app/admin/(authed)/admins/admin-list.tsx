"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { AdminSummary } from "@/lib/admins/repository";
import {
  changeAdminPasswordAction,
  createAdminAction,
  deleteAdminAction,
  reissueAdminPasswordAction,
  type ActionResult,
} from "../../actions";

const inputClass = "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm";
const toDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }) : "—";

// 自動で発行したパスワード(追加・再発行)。サーバーには残らないので、閉じたら再表示できない
type Issued = { email: string; password: string; kind: "created" | "reissued" };

function IssuedPassword({ issued, onClose }: { issued: Issued; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-amber-900">
        {issued.kind === "created"
          ? `${issued.email} を管理者に追加しました`
          : `${issued.email} の初期パスワードを再発行しました(この管理者はログインし直しになります)`}
      </p>
      <p className="mt-2 text-xs text-zinc-600">初期パスワード</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <code className="select-all rounded-md border border-amber-200 bg-white px-3 py-2 font-mono text-base tracking-wider">
          {issued.password}
        </code>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(issued.password);
            setCopied(true);
          }}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs hover:bg-zinc-50"
        >
          {copied ? "コピーしました" : "コピー"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm("初期パスワードの表示を消します。消すと二度と確認できません。控えましたか?")) onClose();
          }}
          className="ml-auto text-xs text-zinc-500 hover:underline"
        >
          表示を消す
        </button>
      </div>
      <p className="mt-3 text-xs font-medium text-rose-700">
        ※ このパスワードはここでしか表示されません。表示を消したり、画面を移動・再読み込みしたりすると、
        二度と確認できません。必ず控えてください(わからなくなった場合は「初期パスワード再発行」で発行し直せます)。
      </p>
    </div>
  );
}

export default function AdminList({
  admins,
  myId,
}: {
  admins: AdminSummary[];
  myId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [email, setEmail] = useState("");
  const [issued, setIssued] = useState<Issued | null>(null);
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

  // 追加・再発行で発行したパスワードを画面上部に表示する
  const issue = (action: () => Promise<ActionResult<{ email: string; password: string }>>, kind: Issued["kind"]) =>
    startTransition(async () => {
      setMessage(null);
      const result = await action();
      if (!result.ok) return setMessage({ ok: false, text: result.error });
      setIssued({ ...result.data, kind });
      if (kind === "created") setEmail("");
      window.scrollTo({ top: 0, behavior: "smooth" });
      router.refresh();
    });

  const reissue = (a: AdminSummary) => {
    if (
      !confirm(
        `${a.email} の初期パスワードを再発行します。今のパスワードは使えなくなり、この管理者はログインし直しになります。よろしいですか?`,
      )
    ) {
      return;
    }
    issue(() => reissueAdminPasswordAction(a.id), "reissued");
  };

  const remove = (a: AdminSummary) => {
    const isMe = a.id === myId;
    const text = isMe
      ? "自分のアカウントを削除します。削除するとすぐにログアウトし、このアカウントでは二度とログインできません。よろしいですか?"
      : `${a.email} を管理者から削除します。よろしいですか?`;
    if (!confirm(text)) return;
    if (isMe) {
      // 自分を削除するとセッションも消えるので、ログイン画面へ移動する
      startTransition(async () => {
        const result = await deleteAdminAction(a.id);
        if (!result.ok) return setMessage({ ok: false, text: result.error });
        router.push("/admin/login");
      });
    } else {
      run(() => deleteAdminAction(a.id), `${a.email} を削除しました`);
    }
  };

  return (
    <div className="mt-5 space-y-5">
      {message && (
        <p className={`rounded-lg p-3 text-sm ${message.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>
          {message.text}
        </p>
      )}

      {issued && <IssuedPassword key={issued.password} issued={issued} onClose={() => setIssued(null)} />}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
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
                        placeholder="新しいパスワード"
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
                  <div className="flex justify-end gap-3">
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
                    {/* 本人が初期パスワードを変更するまでだけ出す。自分の行には出さない
                        (再発行すると、表示を見る前に自分がログアウトするため) */}
                    {a.id !== myId && a.mustChangePassword && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => reissue(a)}
                        className="text-amber-700 hover:underline disabled:opacity-40"
                      >
                        初期パスワード再発行
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={pending || admins.length <= 1}
                      onClick={() => remove(a)}
                      title={admins.length <= 1 ? "最後の管理者は削除できません" : undefined}
                      className="text-rose-600 hover:underline disabled:opacity-40 disabled:hover:no-underline"
                    >
                      アカウント削除
                    </button>
                  </div>
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
          issue(() => createAdminAction(email), "created");
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
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-40"
          >
            追加
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          初期パスワードは自動で発行し、この画面の上部に表示します。
          追加した人には安全な方法で伝え、ログイン後に「パスワード変更」で変えてもらってください。
        </p>
      </form>
    </div>
  );
}

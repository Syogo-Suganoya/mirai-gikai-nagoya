"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { PublishStatus } from "@/lib/bills/types";
import {
  deleteBillAction,
  duplicateBillAction,
  setPublishStatusAction,
  setReviewCompletedAction,
  type ActionResult,
} from "../actions";

// 議案一覧の1行のうち、ボタンで操作する部分(公開・レビュー・更新日・操作メニュー)
export default function BillRowActions({
  id,
  slug,
  publishStatus,
  isReviewCompleted,
  updatedAt,
}: {
  id: string;
  slug: string;
  publishStatus: PublishStatus;
  isReviewCompleted: boolean;
  updatedAt: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // 成功したら一覧を読み直す。navigateTo を返したときはその画面へ移動する(refresh と同時に呼ぶと移動が打ち消されるため)
  const run = <T,>(action: () => Promise<ActionResult<T>>, navigateTo?: (data: T) => string) =>
    startTransition(async () => {
      setError(null);
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (navigateTo) router.push(navigateTo(result.data));
      else router.refresh();
    });

  const published = publishStatus === "published";

  return (
    <>
      <td className="px-3 py-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setPublishStatusAction(id, published ? "draft" : "published"))}
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold disabled:opacity-50 ${
            published ? "bg-emerald-500 text-white" : "bg-zinc-200 text-zinc-700"
          }`}
          title={published ? "クリックで下書きに戻す" : "クリックで公開する"}
        >
          {published ? "公開中" : "下書き"}
        </button>
        {published && (
          <a href={`/bills/${slug}`} target="_blank" className="ml-2 text-xs text-amber-700 underline">
            表示
          </a>
        )}
      </td>
      <td className="px-3 py-3">
        <label className="flex items-center gap-1 text-xs text-zinc-600">
          <input
            type="checkbox"
            checked={isReviewCompleted}
            disabled={pending}
            onChange={(e) => run(() => setReviewCompletedAction(id, e.target.checked))}
          />
          {isReviewCompleted ? "完了" : "未完了"}
        </label>
      </td>
      <td className="px-3 py-3 text-xs text-zinc-500">{updatedAt}</td>
      <td className="whitespace-nowrap px-3 py-3 text-xs">
        <Link href={`/admin/bills/${id}/edit`} className="text-amber-700 hover:underline">
          編集
        </Link>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(
              () => duplicateBillAction(id),
              (data) => `/admin/bills/${data.id}/edit?duplicated=1`,
            )
          }
          className="ml-3 text-zinc-600 hover:underline disabled:opacity-50"
        >
          複製
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm("この議案を削除します。元に戻せません。よろしいですか?")) {
              run(() => deleteBillAction(id));
            }
          }}
          className="ml-3 text-rose-600 hover:underline disabled:opacity-50"
        >
          削除
        </button>
        {error && <p className="mt-1 max-w-48 whitespace-normal text-rose-600">{error}</p>}
      </td>
    </>
  );
}

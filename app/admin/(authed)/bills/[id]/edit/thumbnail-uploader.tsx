"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import BillThumbnailView from "@/app/components/bill-thumbnail";
import type { BillThumbnail } from "@/lib/bills/types";
import { deleteThumbnailAction, uploadThumbnailAction } from "../../../../actions";

const MAX_WIDTH = 1280;

// 送る前にブラウザで縮小して JPEG にする(スマホの写真をそのまま送ると数MBになるため)
async function shrinkImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("この画像は読み込めませんでした。JPEG・PNG・WebP の画像を選んでください");
  });
  const scale = Math.min(1, MAX_WIDTH / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; // 透過 PNG の透明部分を白にする
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("画像の変換に失敗しました"))), "image/jpeg", 0.85),
  );
}

// 編集画面のサムネイル画像。アップロードした画像があればそれを、無ければデフォルト(イラスト・写真)を表示する
export default function ThumbnailUploader({
  billId,
  uploadedUrl,
  defaultThumbnail,
}: {
  billId: string;
  uploadedUrl: string | null;
  defaultThumbnail: BillThumbnail | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const upload = (file: File) =>
    startTransition(async () => {
      setError(null);
      try {
        const formData = new FormData();
        formData.append("file", await shrinkImage(file), "thumbnail.jpg");
        const result = await uploadThumbnailAction(billId, formData);
        if (!result.ok) return setError(result.error);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "アップロードに失敗しました");
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });

  const remove = () => {
    if (!confirm("アップロードした画像を削除して、デフォルトの表示に戻します。よろしいですか?")) return;
    startTransition(async () => {
      setError(null);
      const result = await deleteThumbnailAction(billId);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  };

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="font-semibold">サムネイル画像</h2>
      <p className="mt-1 text-xs text-zinc-500">
        横長(5:2)で表示され、はみ出した上下は切れます。画像をアップロードしていないときはデフォルトの表示になります。
        変更はすぐ公開サイトに反映されます(「保存」は不要)。
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          {uploadedUrl || defaultThumbnail ? (
            <BillThumbnailView thumbnail={defaultThumbnail} uploadedUrl={uploadedUrl} />
          ) : (
            <div className="flex aspect-[5/2] items-center justify-center rounded-lg border border-dashed border-zinc-300 text-xs text-zinc-400">
              サムネイルなし
            </div>
          )}
          <p className="mt-1 text-xs text-zinc-500">
            {uploadedUrl ? "アップロードした画像を表示中" : "デフォルトの表示"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-col">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
            }}
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-amber-400 bg-white px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
          >
            {pending ? "処理中…" : uploadedUrl ? "画像を差しかえる" : "画像をアップロード"}
          </button>
          {uploadedUrl && (
            <button
              type="button"
              disabled={pending}
              onClick={remove}
              className="rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 disabled:opacity-50"
            >
              削除してデフォルトに戻す
            </button>
          )}
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
    </section>
  );
}

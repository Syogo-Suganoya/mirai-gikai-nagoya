import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/admin";
import { notFound } from "next/navigation";
import { getCouncil } from "@/data/councils";
import { uploadedThumbnailUrl } from "@/lib/bills/card";
import { listFuriganaWords } from "@/lib/bills/furigana";
import { toInput } from "@/lib/bills/input";
import { findBillById } from "@/lib/bills/repository";
import { billToFormValues } from "@/lib/bills/schema";
import { publishStatusLabels } from "@/lib/bills/types";
import BillForm from "../../../bill-form";
import ThumbnailUploader from "./thumbnail-uploader";

export default async function EditBillPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; duplicated?: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const { created, duplicated } = await searchParams;
  const bill = await findBillById(id);
  if (!bill) notFound();

  const published = bill.publishStatus === "published";
  // ふりがなの確認用に、保存済みの内容から自動の読みを作り直す(修正を当てる前の読みを見せるため)
  const furiganaWords = await listFuriganaWords(toInput(bill));

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin" className="text-sm text-zinc-500 hover:text-amber-700">
        ← 議案管理に戻る
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-bold">議案の編集</h1>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            published ? "bg-emerald-500 text-white" : "bg-zinc-200 text-zinc-700"
          }`}
        >
          {publishStatusLabels[bill.publishStatus]}
        </span>
        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600">
          レビュー{bill.isReviewCompleted ? "完了" : "未完了"}
        </span>
        {published && (
          <a href={`/bills/${bill.slug}`} target="_blank" className="text-xs text-amber-700 underline">
            公開ページを見る ↗
          </a>
        )}
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        {getCouncil(bill.council).name} ・ 公開/下書きとレビュー完了は、議案管理の一覧で切り替えます
      </p>
      {(created || duplicated) && (
        <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          {duplicated
            ? "複製して下書きとして作成しました。slug と議案名を確認してください。"
            : "下書きとして作成しました。"}
        </p>
      )}
      <div className="mt-5">
        <BillForm
          mode="edit"
          id={bill.id}
          defaultValues={billToFormValues(bill)}
          furiganaWords={furiganaWords}
          thumbnailEditor={
            <ThumbnailUploader
              billId={bill.id}
              uploadedUrl={uploadedThumbnailUrl(bill)}
              defaultThumbnail={bill.thumbnail}
            />
          }
        />
      </div>
    </div>
  );
}

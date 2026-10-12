import Link from "next/link";
import { notFound } from "next/navigation";
import { getCouncil } from "@/data/councils";
import { getPublishedBillBySlug, getPublishedBills } from "@/lib/bills/queries";
import { statusPillClass } from "@/lib/bills/status-style";
import { billStatusLabels } from "@/lib/bills/types";
import ChatWidget from "@/app/components/chat-widget";
import FuriganaText from "@/app/furigana-text";
import BillThumbnailView from "@/app/components/bill-thumbnail";
import BillExplanation from "./bill-explanation";
import StatusStepper from "./status-stepper";
import BillDetailSections from "./bill-detail-sections";

// ビルド時に公開中の議案を静的生成し、その後に公開された議案はアクセス時に生成する
export async function generateStaticParams() {
  return (await getPublishedBills()).map((bill) => ({ id: bill.slug }));
}

export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bill = await getPublishedBillBySlug(id);
  if (!bill) {
    notFound();
  }

  const council = getCouncil(bill.council);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-amber-700"
      >
        ← トップに戻る
      </Link>

      {!bill.isReviewCompleted && (
        <p className="mt-3 rounded-xl border border-amber-300 bg-amber-100 px-4 py-3 text-sm text-amber-900">
          この解説は内容を確認している途中です。正確な情報は各議会の公式サイトを確認してください。
        </p>
      )}

      {/* ヒーローカード */}
      <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        {bill.thumbnail && (
          <div className="mb-4">
            <BillThumbnailView thumbnail={bill.thumbnail} />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-semibold text-white">
            {council.shortName}
          </span>
          <span className="text-xs text-zinc-500">
            {bill.sessionName} {bill.billNumber}
          </span>
        </div>

        <h1 className="mt-2 text-2xl font-bold leading-snug">
          <FuriganaText segments={bill.furigana.name} />
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPillClass[bill.status]}`}
          >
            {billStatusLabels[bill.status]}
          </span>
          {bill.submittedDate && (
            <span className="text-zinc-500">提出日: {bill.submittedDate}</span>
          )}
          {bill.decidedDate && (
            <span className="text-zinc-500">議決日: {bill.decidedDate}</span>
          )}
        </div>

        <BillExplanation
          easyFurigana={bill.furigana.easy}
          detailedFurigana={bill.furigana.detailed}
        />

        <div className="mt-3 flex flex-wrap gap-1.5">
          {bill.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-500"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* 審議のステータス */}
      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-4 font-semibold">👉 審議のステータス</h2>
        <StatusStepper status={bill.status} />
      </section>

      <BillDetailSections
        keyPoints={bill.furigana.keyPoints}
        reasons={bill.furigana.reasons}
        debatePoints={bill.furigana.debatePoints}
        affectedGroups={bill.furigana.affectedGroups}
      />

      <section className="mt-8">
        <h2 className="font-semibold">💬 この議案について質問する</h2>
        <ChatWidget billId={bill.slug} />
      </section>

      <p className="mt-6 text-xs text-zinc-400">
        {bill.sourceUrl && (
          <>
            出典:{" "}
            <a
              href={bill.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-amber-700"
            >
              {council.name} 公式サイトの議案一覧
            </a>
            {" ・ "}
          </>
        )}
        {"審議の詳しい内容は "}
        <a
          href={council.minutesSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-amber-700"
        >
          {council.name}の会議録検索
        </a>
        {" で議案名を入力すると読めます"}
      </p>
    </div>
  );
}
